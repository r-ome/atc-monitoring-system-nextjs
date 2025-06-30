"use server";

import { getRegisteredBidderByBidderNumber } from "@/app/(protected)/auctions/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";
import { BidderItemsTable } from "./components/BidderItemsTable";

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ bidder_number: string; auction_date: string }>;
}>) {
  const { bidder_number, auction_date } = await params;
  const res = await getRegisteredBidderByBidderNumber(
    bidder_number,
    auction_date
  );

  if (!res.ok) {
    return <div>Error Page</div>;
  }

  const bidder = res.value;

  const totalUnpaidItemsPrice = bidder.auction_inventories
    .filter((item) => item.status === "UNPAID")
    .reduce((acc, item) => (acc += item.price), 0);

  const serviceChargeAmount =
    (totalUnpaidItemsPrice * bidder.service_charge) / 100;
  const registrationFeeAmount = bidder.already_consumed
    ? 0
    : bidder.registration_fee;

  const grandTotalBalance =
    totalUnpaidItemsPrice + serviceChargeAmount - registrationFeeAmount;

  const BidderProfile = () => (
    <div className="space-y-2 border-t px-6 pt-6 flex">
      {[
        {
          label: "Auction Date",
          value: bidder.auction_date,
        },
        {
          label: "Time Registered",
          value: bidder.created_at,
        },
        {
          label: "Registration Fee",
          value: `Php ${bidder.bidder.registration_fee.toLocaleString()}`,
        },
        {
          label: "Service Charge",
          value: `${bidder.service_charge}%`,
        },
        {
          label: "Total Items",
          value: `${bidder.auction_inventories.length} Items`,
        },
        {
          label: "Balance",
          value: `₱ ${grandTotalBalance.toLocaleString()}`,
        },
      ].map((detail, i) => (
        <div key={i} className={cn("flex flex-col items-center w-1/2")}>
          <p className="text-muted-foreground">{detail.label}</p>{" "}
          <p className="text-card-foreground">{detail.value}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full">
        <CardHeader className="flex justify-between">
          <div>
            <CardTitle>Bidder: {bidder.bidder.bidder_number}</CardTitle>
            <CardDescription>{bidder.bidder.full_name}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BidderProfile />
        </CardContent>
      </Card>

      <BidderItemsTable
        auctionInventories={bidder.auction_inventories}
        registeredBidder={bidder}
      />
    </div>
  );
}
