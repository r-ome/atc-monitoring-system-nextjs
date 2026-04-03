export const dynamic = "force-dynamic";

import { formatDate } from "@/app/lib/utils";
import { getAuction } from "@/app/(protected)/auctions/actions";
import { AuctionInventoryRow } from "src/entities/models/Auction";
import { AuctionNavigation } from "@/app/(protected)/auctions/components/AuctionNavigation";
import {
  Card,
  CardHeader,
  CardContent,
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
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { AuctionContainerSummaryTable } from "../components/AuctionContainerSummaryTable";
import { PageHeader, StatCard, StatCardGroup } from "@/app/components/admin";
import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/app/components/ui/alert";
import { ErrorComponent } from "@/app/components/ErrorComponent";

type AuctionItemSchema = AuctionInventoryRow[];

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
    if (res.error.message === "Auction not found!")
      return (
        <div className="h-40 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>No Auction on this day.</AlertTitle>
              <AlertDescription>
                If you want, you can start an auction today!
              </AlertDescription>
            </Alert>
            {!["ENCODER", "MODERATOR"].includes(session.user.role) && (
              <div className="mt-4 flex justify-center">
                <StartAuctionButton />
              </div>
            )}
          </div>
        </div>
      );

    return <ErrorComponent error={res.error} />;
  }

  const auction = res.value;
  const total_registered_bidders = auction.registered_bidders.length - 1;
  const total_registration_fee = auction.registered_bidders.reduce(
    (acc, item) => (acc += item.registration_fee),
    0,
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
    },
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
    0,
  );

  const auction_container = auction.auctions_inventories.reduce(
    (acc, ai) => {
      const key = ai.inventory.container.barcode;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(ai);
      return acc;
    },
    {} as Record<string, typeof auction.auctions_inventories>,
  );

  const container_summary = Object.keys(auction_container)
    .map((item) => ({
      barcode: item,
      total_items: auction_container[item]?.length ?? 0,
      total_sale:
        auction_container[item]?.reduce((acc, ac) => {
          acc += ac.price;
          return acc;
        }, 0) ?? 0,
    }))
    .sort((a, b) => b.total_sale - a.total_sale);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={formatDate(new Date(auction_date), "EEEE, MMMM dd, yyyy")}
      />

      {session.user.role !== "MODERATOR" ? <AuctionNavigation /> : null}

      <div
        className={cn(
          "flex flex-col gap-6",
          session.user.role === "ENCODER" && "hidden",
          session.user.role === "MODERATOR" && "show",
        )}
      >
        <StatCardGroup columns={3}>
          <StatCard
            title="Registered Bidders"
            value={total_registered_bidders}
            description="Total Registered Bidders"
            icon={Users}
            variant="default"
            contentClassName="py-0"
          />
          <StatCard
            title="Total Registration Fee"
            value={`₱${total_registration_fee.toLocaleString()}`}
            description="Total Registration Fee"
            icon={DollarSign}
            variant="primary"
            contentClassName="py-0"
          />
          <StatCard
            title="Total Sales"
            value={`₱${total_item_price.toLocaleString()}`}
            description={`₱${total_service_charge_amount.toLocaleString()} Service Charge Amount`}
            icon={TrendingUp}
            variant="success"
            contentClassName="py-0"
          />
        </StatCardGroup>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <AuctionContainerSummaryTable
            containerSummary={container_summary}
          />

          {/* Item Summary */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle>Item Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-8">
                  <p className="text-sm text-muted-foreground uppercase">Total Items</p>
                  <p className="text-2xl font-bold">{total_items}</p>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <p className="text-sm text-muted-foreground uppercase">Paid</p>
                  <p className="text-2xl font-bold text-status-success">{filtered_items.paid_items.length}</p>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <p className="text-sm text-muted-foreground uppercase">Unpaid</p>
                  <p className="text-2xl font-bold text-status-error">{filtered_items.unpaid_items.length}</p>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <p className="text-sm text-muted-foreground uppercase">Cancelled</p>
                  <p className="text-2xl font-bold text-muted-foreground">{filtered_items.cancelled_items.length}</p>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <p className="text-sm text-muted-foreground uppercase">Refunded</p>
                  <p className="text-2xl font-bold text-status-info">{filtered_items.refunded_items.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
