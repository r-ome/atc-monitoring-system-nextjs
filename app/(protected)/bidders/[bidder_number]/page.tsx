import { getBidderByBidderNumber } from "@/app/(protected)/bidders/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { UpdateBidderModal } from "./UpdateBidderModal";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from "@/app/components/ui/table";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: { bidder_number: string } }>) {
  const { bidder_number } = await params;
  const res = await getBidderByBidderNumber(bidder_number);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const bidder = res.value;
  const BidderProfile = () => {
    return (
      <div className="space-y-2 border-t px-6 pt-6 flex">
        {[
          {
            label: "Service Charge",
            value: `${bidder.service_charge}%`,
          },
          {
            label: "Registration Fee",
            value: `₱${bidder.registration_fee.toLocaleString()}`,
          },
          {
            label: "Joined at",
            value: bidder.created_at,
          },
          {
            label: "Contact Number",
            value: bidder.contact_number,
          },
          {
            label: "Birth Date",
            value: bidder.birthdate,
          },
        ].map((detail, i) => (
          <div key={i} className="flex flex-col items-center w-1/2">
            <p className="text-muted-foreground">{detail.label}</p>{" "}
            <p className="text-card-foreground">{detail.value}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <Card className="w-full">
        <CardHeader className="flex justify-between">
          <div>
            <CardTitle>
              Bidder: {bidder.bidder_number}{" "}
              <Badge
                variant={
                  ["INACTIVE", "BANNED"].includes(bidder.status)
                    ? "destructive"
                    : "success"
                }
              >
                {bidder.status}
              </Badge>
            </CardTitle>
            <CardDescription>{bidder.full_name}</CardDescription>
          </div>
          <UpdateBidderModal bidder={bidder} />
        </CardHeader>
        <CardContent>
          <BidderProfile />
        </CardContent>
      </Card>

      <div className="border rounded-2xl p-2">
        <Table>
          <TableCaption>Auctions Joined</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Auction Date</TableHead>
              <TableHead>Service Charge</TableHead>
              <TableHead>Registration Fee</TableHead>
              <TableHead>Balance</TableHead>
              <TableHead>Total Items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bidder.auctions_joined.map((item) => (
              <TableRow key={item.auction_bidder_id}>
                <TableCell>{item.created_at}</TableCell>
                <TableCell>{item.service_charge}%</TableCell>
                <TableCell>{item.registration_fee.toLocaleString()}</TableCell>
                <TableCell>₱{item.balance.toLocaleString()}</TableCell>
                <TableCell>
                  {(item.auctions_inventories || []).length}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
