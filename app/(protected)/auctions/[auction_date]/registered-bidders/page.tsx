import {
  getAuction,
  getRegisteredBiddersSummary,
} from "@/app/(protected)/auctions/actions";
import { AuctionSectionNav } from "@/app/(protected)/auctions/components/AuctionSectionNav";
import { AuctionSecondaryHeader } from "@/app/(protected)/auctions/components/AuctionSecondaryHeader";
import { AuctionMiniStat } from "@/app/(protected)/auctions/components/AuctionMiniStat";
import { RegisteredBiddersTable } from "../../components/RegisteredBiddersTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { formatNumberToCurrency } from "@/app/lib/utils";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const { auction_date } = await params;

  const auctionRes = await getAuction(auction_date);
  if (!auctionRes.ok) {
    return <ErrorComponent error={auctionRes.error} />;
  }
  const auction = auctionRes.value;

  const biddersRes = await getRegisteredBiddersSummary(auction.auction_id);
  if (!biddersRes.ok) {
    return <ErrorComponent error={biddersRes.error} />;
  }
  const bidders = biddersRes.value;

  const totals = bidders.reduce(
    (acc, b) => {
      acc.registration_fee += b.registration_fee;
      acc.items += b.auction_inventories_count;
      acc.balance += b.balance;
      if (b.balance > 0) acc.unpaid_count += 1;
      return acc;
    },
    { registration_fee: 0, items: 0, balance: 0, unpaid_count: 0 },
  );

  // Exclude the cancelled-bin placeholder from the visible count.
  const visible_bidder_count = Math.max(bidders.length - 1, 0);

  const stats: {
    label: string;
    value: string | number;
    sub: string;
    danger?: boolean;
  }[] = [
    {
      label: "Bidders",
      value: visible_bidder_count,
      sub: "Excludes cancelled bin",
    },
    {
      label: "Registration Fee",
      value: formatNumberToCurrency(totals.registration_fee),
      sub: "Collected from registrations",
    },
    {
      label: "Outstanding Balance",
      value: totals.balance ? formatNumberToCurrency(totals.balance) : "₱0",
      sub: `${totals.unpaid_count} unpaid bidder${
        totals.unpaid_count === 1 ? "" : "s"
      }`,
      danger: totals.balance > 0,
    },
  ];

  return (
    <PageContainer>
      <AuctionSecondaryHeader
        auctionDate={auction_date}
        branchName={auction.branch.name}
        startedAt={auction.started_at}
      />

      <AuctionSectionNav basePath={`/auctions/${auction_date}`} />

      <div className="grid grid-cols-2 gap-[18px] [&>*:nth-child(3)]:col-span-2 lg:grid-cols-3 lg:[&>*:nth-child(3)]:col-span-1 2xl:gap-6">
        {stats.map((s) => (
          <AuctionMiniStat
            key={s.label}
            label={s.label}
            value={s.value}
            sub={s.sub}
            danger={s.danger}
          />
        ))}
      </div>

      <RegisteredBiddersTable registeredBidders={bidders} />
    </PageContainer>
  );
}
