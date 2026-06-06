"use server";

import {
  getAuction,
  getRegisteredBidderByBidderNumber,
} from "@/app/(protected)/auctions/actions";
import { Card } from "@/app/components/ui/card";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { BidderItemsTable } from "./components/BidderItemsTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { BidderRegistrationOptions } from "./components/BidderRegistrationOptions";
import { getAuctionInventoriesPayableBase } from "src/entities/models/AuctionPayableAmount";
import { PageContainer } from "@/app/components/PageContainer";
import { AuctionSecondaryHeader } from "@/app/(protected)/auctions/components/AuctionSecondaryHeader";
import { AuctionSectionNav } from "@/app/(protected)/auctions/components/AuctionSectionNav";
import { AuctionMiniStat } from "@/app/(protected)/auctions/components/AuctionMiniStat";
import { getBidderReceiptsWithItems } from "@/app/(protected)/auctions/[auction_date]/payments/actions";

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ bidder_number: string; auction_date: string }>;
}>) {
  const { bidder_number, auction_date } = await params;

  const auctionRes = await getAuction(auction_date);
  if (!auctionRes.ok) {
    return <ErrorComponent error={auctionRes.error} />;
  }
  const auction = auctionRes.value;

  const res = await getRegisteredBidderByBidderNumber(
    bidder_number,
    auction_date,
  );
  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }
  const bidder = res.value;

  const receiptsRes = await getBidderReceiptsWithItems(bidder.auction_bidder_id);
  if (!receiptsRes.ok) {
    return <ErrorComponent error={receiptsRes.error} />;
  }
  const receipts = receiptsRes.value;

  const totalUnpaidItemsPrice = getAuctionInventoriesPayableBase(
    bidder.auction_inventories,
  );
  const serviceChargeAmount =
    (totalUnpaidItemsPrice * bidder.service_charge) / 100;
  const registrationFeeAmount = bidder.already_consumed
    ? 0
    : bidder.registration_fee;
  const grandTotalBalance =
    totalUnpaidItemsPrice + serviceChargeAmount - registrationFeeAmount;

  const initials = bidder.bidder.full_name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");

  return (
    <PageContainer>
      <AuctionSecondaryHeader
        auctionDate={auction_date}
        branchName={auction.branch.name}
        startedAt={auction.started_at}
        actions={<BidderRegistrationOptions bidder={bidder} />}
      />

      <AuctionSectionNav basePath={`/auctions/${auction_date}`} />

      {/* Bidder profile card */}
      <Card className="flex flex-col gap-4 p-[18px] 2xl:p-5 2xl:text-[15px]">
        <div className="flex flex-wrap items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-[15px] font-bold text-accent-foreground">
            {initials}
          </span>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="font-mono text-[18px] font-semibold tracking-tight 2xl:text-[22px]">
              #{bidder.bidder.bidder_number}
            </span>
            <span className="text-[14px] text-foreground/80 2xl:text-[16px]">
              {bidder.bidder.full_name}
            </span>
          </div>
          <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[14px]">
            Registered {bidder.created_at}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 [&>*:nth-child(5)]:col-span-2 sm:grid-cols-3 sm:[&>*:nth-child(5)]:col-span-1 lg:grid-cols-5">
          <AuctionMiniStat
            label="Auction Date"
            value={
              <span className="text-[15px] font-semibold tracking-tight 2xl:text-[18px]">
                {bidder.auction_date}
              </span>
            }
          />
          <AuctionMiniStat
            label="Registration Fee"
            value={formatNumberToCurrency(bidder.registration_fee)}
            sub={bidder.already_consumed ? "Consumed toward items" : "Outstanding"}
          />
          <AuctionMiniStat
            label="Service Charge"
            value={`${bidder.service_charge}%`}
            sub={formatNumberToCurrency(serviceChargeAmount)}
          />
          <AuctionMiniStat
            label="Items"
            value={bidder.auction_inventories.length.toLocaleString()}
          />
          <AuctionMiniStat
            label="Balance"
            value={formatNumberToCurrency(grandTotalBalance)}
            sub={
              grandTotalBalance > 0
                ? "Awaiting payment"
                : grandTotalBalance < 0
                  ? "Registration fee not fully consumed"
                  : "Settled"
            }
            danger={grandTotalBalance > 0}
          />
        </div>
      </Card>

      <BidderItemsTable
        auctionInventories={bidder.auction_inventories}
        registeredBidder={bidder}
        receipts={receipts}
      />
    </PageContainer>
  );
}
