export const dynamic = "force-dynamic";

import {
  getAuction,
  getCounterCheck,
} from "@/app/(protected)/auctions/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { AuctionSectionNav } from "@/app/(protected)/auctions/components/AuctionSectionNav";
import { AuctionSecondaryHeader } from "@/app/(protected)/auctions/components/AuctionSecondaryHeader";
import { AuctionMiniStat } from "@/app/(protected)/auctions/components/AuctionMiniStat";
import { UploadCounterCheckModal } from "./components/UploadCounterCheckModal";
import { CounterCheckTable } from "./CounterCheckTable";
import { formatNumberToCurrency } from "@/app/lib/utils";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const { auction_date } = await params;
  const auction_res = await getAuction(auction_date);

  if (!auction_res.ok) {
    return <ErrorComponent error={auction_res.error} />;
  }

  const auction = auction_res.value;
  const counter_check_res = await getCounterCheck(auction.auction_id);

  if (!counter_check_res.ok) {
    return <ErrorComponent error={counter_check_res.error} />;
  }

  const counter_check = counter_check_res.value;
  const total_value = counter_check.reduce(
    (sum, row) => sum + (Number(row.price ?? 0) || 0),
    0,
  );
  const error_count = counter_check.filter(
    (row) => row.bidder_number === "0000" || !row.price,
  ).length;

  return (
    <PageContainer>
      <AuctionSecondaryHeader
        auctionDate={auction_date}
        branchName={auction.branch.name}
        startedAt={auction.started_at}
        actions={<UploadCounterCheckModal auction_id={auction.auction_id} />}
      />

      <AuctionSectionNav basePath={`/auctions/${auction_date}`} />

      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3 2xl:gap-6">
        <AuctionMiniStat
          label="Total Records"
          value={counter_check.length.toLocaleString()}
          sub="From uploaded sheets"
        />
        <AuctionMiniStat
          label="Counter Check Total"
          value={formatNumberToCurrency(total_value)}
          sub="Summed line totals"
        />
        <AuctionMiniStat
          label="Errors"
          value={error_count.toLocaleString()}
          sub={
            error_count === 0
              ? "No errors detected"
              : "Needs reconciliation"
          }
          danger={error_count > 0}
        />
      </div>

      <CounterCheckTable counterCheck={counter_check} />
    </PageContainer>
  );
}
