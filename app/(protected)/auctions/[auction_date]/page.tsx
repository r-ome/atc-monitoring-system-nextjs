import { format } from "date-fns";
import { getAuction } from "@/app/(protected)/auctions/actions";
import { AuctionsInventorySchema } from "src/entities/models/Auction";
import { AuctionNavigation } from "@/app/(protected)/auctions/components/AuctionNavigation";
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { cn } from "@/app/lib/utils";
import { StartAuctionButton } from "../components/StartAuctionButton";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";

type AuctionItemSchema = Omit<
  AuctionsInventorySchema,
  "inventory" | "auction_bidder" | "histories" | "receipt"
>[];

type AuctionItems = {
  paid_items: AuctionItemSchema;
  unpaid_items: AuctionItemSchema;
  cancelled_items: AuctionItemSchema;
  refunded_items: AuctionItemSchema;
};

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const session = await getServerSession(authOptions);
  const { auction_date } = await params;
  const res = await getAuction(auction_date);

  if (!session) redirect("/login");

  if (!res.ok) {
    if (res.error.message === "Auction not yet created")
      return (
        <div className="h-40 flex items-center justify-center">
          <Card className="p-4 text-center w-2/6">
            <CardHeader>
              <CardTitle className="text-red-500 text-lg">
                No Auction on this day.
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                if you want you can start an auction today!
              </p>
              {session.user.role !== "ENCODER" && <StartAuctionButton />}
            </CardHeader>
          </Card>
        </div>
      );

    return <ErrorComponent error={res.error} />;
  }

  const auction = res.value;
  const total_registered_bidders = auction.registered_bidders.length - 1; // minus one for the atc_default_bidder
  const total_registration_fee = auction.registered_bidders.reduce(
    (acc, item) => (acc += item.registration_fee),
    0
  );

  const total_items = auction.auctions_inventories.length;
  const filtered_items = auction.auctions_inventories.reduce<AuctionItems>(
    (acc, item) => {
      if (item.status === "PAID") acc["paid_items"].push(item);
      if (item.status === "UNPAID") acc["unpaid_items"].push(item);
      if (item.status === "CANCELLED") acc["cancelled_items"].push(item);
      if (item.status === "REFUNDED") acc["refunded_items"].push(item);

      return acc;
    },
    {
      paid_items: [],
      unpaid_items: [],
      cancelled_items: [],
      refunded_items: [],
    }
  );
  const total_item_price = [
    ...filtered_items.paid_items,
    ...filtered_items.unpaid_items,
  ].reduce((acc, item) => (acc += item.price), 0);

  const total_service_charge_amount = auction.registered_bidders.reduce(
    (acc, registered_bidder) => {
      const total_item_price = registered_bidder.auction_inventories
        .filter((item) => ["PAID", "UNPAID"].includes(item.status))
        .reduce((acc, item) => (acc += item.price), 0);
      const service_charge_amount =
        (registered_bidder.service_charge * total_item_price) / 100;
      return (acc += service_charge_amount);
    },
    0
  );

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight text-balance">
        {format(auction_date, "EEEE, MMMM dd, yyyy")}
      </h1>

      <AuctionNavigation />

      <div
        className={cn(
          "flex flex-col gap-4 mt-4",
          session.user.role === "ENCODER" && "hidden"
        )}
      >
        <div className="grid grid-cols-3 gap-4">
          <Card className="w-full shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                {total_registered_bidders} Registered Bidders
              </CardTitle>
              <CardDescription>Total Registered Bidders</CardDescription>
            </CardHeader>
          </Card>

          <Card className="w-full shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                ₱{total_registration_fee.toLocaleString()} Total Registration
                Fee
              </CardTitle>
              <CardDescription>Total Registration Fee</CardDescription>
            </CardHeader>
          </Card>

          <Card className="w-full shadow-none">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold">
                ₱{total_item_price.toLocaleString()} Total Sales
              </CardTitle>
              <CardDescription>
                ₱{total_service_charge_amount.toLocaleString()} Service Charge
                Amount
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="flex w-[200px] gap-4">
          <Table className="border">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right font-bold">TOTAL</TableHead>
                <TableHead className="text-right font-bold">
                  {total_items} ITEMS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.keys(filtered_items) as (keyof AuctionItems)[]).map(
                (item) => (
                  <TableRow key={item}>
                    <TableCell
                      className={cn(
                        "text-right font-semibold",
                        item === "paid_items" && "text-green-500",
                        ["cancelled_items", "refunded_items"].includes(item) &&
                          "text-red-500",
                        item === "unpaid_items" && "text-orange-500"
                      )}
                    >
                      {item.replace(/_items/g, " ").toLocaleUpperCase()}
                    </TableCell>
                    <TableCell className="text-right">
                      {filtered_items[item].length} ITEMS
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
