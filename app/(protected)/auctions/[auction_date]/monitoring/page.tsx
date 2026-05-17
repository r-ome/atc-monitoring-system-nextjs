export const dynamic = "force-dynamic";

import {
  getAuction,
  getCounterCheck,
  getMonitoring,
} from "@/app/(protected)/auctions/actions";
import { MonitoringTable } from "./MonitoringTable";
import { AuctionSectionNav } from "@/app/(protected)/auctions/components/AuctionSectionNav";
import { AuctionSecondaryHeader } from "@/app/(protected)/auctions/components/AuctionSecondaryHeader";
import { AuctionMiniStat } from "@/app/(protected)/auctions/components/AuctionMiniStat";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
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
  const monitoring_res = await getMonitoring(auction.auction_id);
  const counter_check_res = await getCounterCheck(auction.auction_id);

  if (!monitoring_res.ok) {
    return <ErrorComponent error={monitoring_res.error} />;
  }

  if (!counter_check_res.ok) {
    return <ErrorComponent error={counter_check_res.error} />;
  }

  const monitoring = monitoring_res.value;
  const counter_check = counter_check_res.value;

  const stats = monitoring.reduce(
    (acc, item) => {
      const has_refunded_history = item.histories.some((h) =>
        h.remarks?.startsWith("Refunded item"),
      );
      const is_refunded = item.status === "REFUNDED" || has_refunded_history;
      acc.total += 1;
      if (item.status === "PAID") {
        acc.paid += 1;
        acc.paid_amount += item.price;
      } else if (item.status === "UNPAID") {
        acc.unpaid += 1;
        acc.unpaid_amount += item.price;
      } else if (is_refunded) {
        acc.refunded += 1;
      } else if (item.status === "CANCELLED") {
        acc.cancelled += 1;
      }
      return acc;
    },
    {
      total: 0,
      paid: 0,
      unpaid: 0,
      paid_amount: 0,
      unpaid_amount: 0,
      cancelled: 0,
      refunded: 0,
    },
  );
  const payable = stats.paid + stats.unpaid;
  const gross = stats.paid_amount + stats.unpaid_amount;
  const avg_item_price = payable ? Math.round(gross / payable) : 0;

  return (
    <PageContainer>
      <AuctionSecondaryHeader
        auctionDate={auction_date}
        branchName={auction.branch.name}
        startedAt={auction.started_at}
      />

      <AuctionSectionNav basePath={`/auctions/${auction_date}`} />

      <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4 2xl:gap-6">
        <AuctionMiniStat
          label="Total Items"
          value={stats.total.toLocaleString()}
          sub={`${payable} payable · ${stats.cancelled + stats.refunded} void`}
        />
        <AuctionMiniStat
          label="Paid"
          value={stats.paid.toLocaleString()}
          sub={formatNumberToCurrency(stats.paid_amount)}
        />
        <AuctionMiniStat
          label="Unpaid"
          value={stats.unpaid.toLocaleString()}
          sub={formatNumberToCurrency(stats.unpaid_amount)}
          danger
        />
        <AuctionMiniStat
          label="Gross Sales"
          value={formatNumberToCurrency(gross)}
          sub={
            payable
              ? `Avg ${formatNumberToCurrency(avg_item_price)} / item`
              : "No payable items yet"
          }
        />
      </div>

      <MonitoringTable monitoring={monitoring} counterCheck={counter_check} />
    </PageContainer>
  );
}
