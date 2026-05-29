import { getAuction } from "@/app/(protected)/auctions/actions";
import { getAuctionTransactions } from "./actions";
import { AuctionTransactionsTable } from "./AuctionTransactionsTable";
import { AuctionSectionNav } from "@/app/(protected)/auctions/components/AuctionSectionNav";
import { AuctionSecondaryHeader } from "@/app/(protected)/auctions/components/AuctionSecondaryHeader";
import { AuctionMiniStat } from "@/app/(protected)/auctions/components/AuctionMiniStat";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { REFUND_PURPOSES } from "src/entities/models/Payment";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const { auction_date } = await params;
  const auction_res = await getAuction(auction_date);
  if (!auction_res.ok) {
    return <ErrorComponent error={auction_res.error} />;
  }
  const auction = auction_res.value;
  const transactions_res = await getAuctionTransactions(auction.auction_id);

  if (!transactions_res.ok) {
    return <ErrorComponent error={transactions_res.error} />;
  }

  const transactions = transactions_res.value;

  const collected = transactions
    .filter((t) => !REFUND_PURPOSES.includes(t.purpose))
    .reduce((sum, t) => sum + t.total_amount_paid, 0);
  const refunded = transactions
    .filter((t) => REFUND_PURPOSES.includes(t.purpose))
    .reduce((sum, t) => sum + t.total_amount_paid, 0);
  const net = collected - refunded;
  const positive_count = transactions.filter(
    (t) => !REFUND_PURPOSES.includes(t.purpose),
  ).length;
  const refund_count = transactions.filter(
    (t) => REFUND_PURPOSES.includes(t.purpose),
  ).length;

  return (
    <PageContainer>
      <AuctionSecondaryHeader
        auctionDate={auction_date}
        branchName={auction.branch.name}
        startedAt={auction.started_at}
      />

      <AuctionSectionNav basePath={`/auctions/${auction_date}`} />

      <div className="grid grid-cols-2 gap-[18px] [&>*:nth-child(3)]:col-span-2 lg:grid-cols-3 lg:[&>*:nth-child(3)]:col-span-1 2xl:gap-6">
        <AuctionMiniStat
          label="Collected"
          value={formatNumberToCurrency(collected)}
          sub={`${positive_count.toLocaleString()} transaction${
            positive_count === 1 ? "" : "s"
          }`}
        />
        <AuctionMiniStat
          label="Refunded"
          value={formatNumberToCurrency(refunded)}
          sub={
            refund_count === 0
              ? "No refunds today"
              : `${refund_count} refund${refund_count === 1 ? "" : "s"}`
          }
          danger={refunded > 0}
        />
        <AuctionMiniStat
          label="Net Cash In"
          value={formatNumberToCurrency(net)}
          sub="Today"
        />
      </div>

      <AuctionTransactionsTable transactions={transactions} />
    </PageContainer>
  );
}
