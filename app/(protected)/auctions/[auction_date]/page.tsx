export const dynamic = "force-dynamic";

import Link from "next/link";
import { formatDate } from "@/app/lib/utils";
import {
  getAuction,
  getMonitoring,
  getRegisteredBiddersSummary,
} from "@/app/(protected)/auctions/actions";
import { RegisterBidderModal } from "@/app/(protected)/auctions/components/RegisterBidderModal";
import { AddOnModal } from "@/app/(protected)/auctions/[auction_date]/monitoring/components/AddOnModal";
import { GenerateReportButton } from "@/app/(protected)/auctions/[auction_date]/monitoring/components/GenerateReport";
import { AuctionSectionNav } from "@/app/(protected)/auctions/components/AuctionSectionNav";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";
import { StartAuctionButton } from "../components/StartAuctionButton";
import { requireSession } from "@/app/lib/auth";
import { AuctionContainerSummaryTable } from "../components/AuctionContainerSummaryTable";
import { StatCard, StatCardGroup } from "@/app/components/admin";
import { PageContainer } from "@/app/components/PageContainer";
import {
  Users,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Gavel,
  Package,
  Tag,
} from "lucide-react";
import { formatNumberCompact, formatNumberToCurrency } from "@/app/lib/utils";
import { Alert, AlertTitle, AlertDescription } from "@/app/components/ui/alert";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const session = await requireSession();
  const { auction_date } = await params;
  const res = await getAuction(auction_date);

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
  const [monitoringRes, summaryRes] = await Promise.all([
    getMonitoring(auction.auction_id),
    getRegisteredBiddersSummary(auction.auction_id),
  ]);

  if (!monitoringRes.ok) {
    return <ErrorComponent error={monitoringRes.error} />;
  }
  if (!summaryRes.ok) {
    return <ErrorComponent error={summaryRes.error} />;
  }
  const biddersSummary = summaryRes.value;

  const total_registered_bidders = auction.registered_bidders.length - 1;
  const total_registration_fee = auction.registered_bidders.reduce(
    (acc, item) => (acc += item.registration_fee),
    0,
  );

  const item_summary = monitoringRes.value.reduce(
    (acc, item) => {
      const has_refunded_history = item.histories.some((history) =>
        history.remarks?.startsWith("Refunded item"),
      );
      const is_refunded = item.status === "REFUNDED" || has_refunded_history;

      acc.total_items += 1;
      if (item.status === "PAID") {
        acc.paid_items += 1;
        acc.paid_amount += item.price;
      }
      if (item.status === "UNPAID") {
        acc.unpaid_items += 1;
        acc.unpaid_amount += item.price;
      }
      if (item.status === "CANCELLED" && !is_refunded) acc.cancelled_items += 1;
      if (is_refunded) acc.refunded_items += 1;
      if (["PAID", "UNPAID"].includes(item.status)) {
        acc.total_item_price += item.price;
      }

      return acc;
    },
    {
      total_items: 0,
      paid_items: 0,
      unpaid_items: 0,
      cancelled_items: 0,
      refunded_items: 0,
      total_item_price: 0,
      paid_amount: 0,
      unpaid_amount: 0,
    },
  );
  const payable_item_count =
    item_summary.paid_items + item_summary.unpaid_items;
  const paid_item_percentage = payable_item_count
    ? Math.round((item_summary.paid_items / payable_item_count) * 100)
    : 0;
  const unpaid_item_percentage = payable_item_count
    ? Math.round((item_summary.unpaid_items / payable_item_count) * 100)
    : 0;

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

  const bidder_by_auction_bidder_id = new Map(
    auction.registered_bidders.map((rb) => [
      rb.auction_bidder_id,
      { bidder_number: rb.bidder.bidder_number, bidder_name: rb.bidder.full_name },
    ]),
  );

  type ContainerTopItem = {
    description: string | null;
    price: number;
    bidder_number: string | null;
    bidder_name: string | null;
  };
  const container_summary = Object.keys(auction_container)
    .map((item) => {
      const items = auction_container[item] ?? [];
      const top = items.reduce<ContainerTopItem | null>((best, ai) => {
        if (!["PAID", "UNPAID"].includes(ai.status)) return best;
        if (!best || ai.price > best.price) {
          const bidder = bidder_by_auction_bidder_id.get(ai.auction_bidder_id);
          return {
            description: ai.description ?? null,
            price: ai.price,
            bidder_number: bidder?.bidder_number ?? null,
            bidder_name: bidder?.bidder_name ?? null,
          };
        }
        return best;
      }, null);
      return {
        barcode: item,
        total_items: items.length,
        total_sale: items.reduce((acc, ac) => acc + ac.price, 0),
        top_item: top,
      };
    })
    .sort((a, b) => b.total_sale - a.total_sale);

  type HighestItem = {
    price: number;
    description: string | null;
    bidder_number: string;
    bidder_name: string;
  };
  const highest_item: HighestItem | null = auction.registered_bidders.reduce<HighestItem | null>(
    (top, rb) => {
      for (const item of rb.auction_inventories) {
        if (!["PAID", "UNPAID"].includes(item.status)) continue;
        if (!top || item.price > top.price) {
          top = {
            price: item.price,
            description: item.description,
            bidder_number: rb.bidder.bidder_number,
            bidder_name: rb.bidder.full_name,
          };
        }
      }
      return top;
    },
    null,
  );

  const auctionDateObj = new Date(auction_date);
  const dayOfWeek = formatDate(auctionDateObj, "EEEE");
  const longDate = formatDate(auctionDateObj, "MMMM d, yyyy");
  const branchName = auction.branch.name;
  const basePath = `/auctions/${auction_date}`;

  return (
    <PageContainer>
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-[13px] text-muted-foreground 2xl:text-[15px]"
      >
        <Link href="/auctions" className="hover:text-foreground">
          Auctions
        </Link>
        <ChevronRight size={12} className="opacity-60" />
        <span className="font-medium text-foreground">{longDate}</span>
      </nav>

      {/* Hero strip */}
      <Card className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:gap-6 sm:p-5 2xl:p-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="caps-label text-[11px] 2xl:text-[14px]">
              {dayOfWeek}
            </span>
            {branchName ? (
              <span
                className="rounded px-1.5 py-0.5 text-[10.5px] font-semibold tracking-wide text-secondary-foreground 2xl:text-[13.5px]"
                style={{
                  background: branchName.toUpperCase().includes("BI")
                    ? "var(--branch-binan)"
                    : "var(--branch-tarlac)",
                }}
              >
                {branchName.toUpperCase()}
              </span>
            ) : null}
          </div>
          <h1 className="truncate text-[18px] font-semibold tracking-tight sm:text-[22px] 2xl:text-[28px]">
            {longDate}
          </h1>
        </div>
        {session.user.role !== "MODERATOR" ? (
          <div className="grid w-full grid-cols-2 gap-2 [&>*]:w-full [&>*]:min-w-0 [&>*:nth-child(3)]:col-span-2 [&_button]:w-full sm:flex sm:w-auto sm:[&>*]:w-auto sm:[&>*:nth-child(3)]:col-span-1 sm:[&_button]:w-auto">
            {session.user.role !== "ENCODER" ? (
              <GenerateReportButton monitoring={monitoringRes.value} />
            ) : null}
            <RegisterBidderModal
              auction_id={auction.auction_id}
              registeredBidders={biddersSummary}
            />
            <AddOnModal
              auction_id={auction.auction_id}
              registered_bidders={auction.registered_bidders}
            />
          </div>
        ) : null}
      </Card>

      {/* Section navigator */}
      {session.user.role !== "MODERATOR" ? (
        <AuctionSectionNav basePath={basePath} />
      ) : null}

      {/* KPI strip + grid (inner cards kept as-is for this layout pass) */}
      <div
        className={cn(
          "flex flex-col gap-[18px] 2xl:gap-6",
          session.user.role === "ENCODER" && "hidden",
          session.user.role === "MODERATOR" && "show",
        )}
      >
        <StatCardGroup
          columns={5}
          className="grid-cols-2 [&>*:nth-child(5)]:col-span-2 lg:grid-cols-5 lg:[&>*:nth-child(5)]:col-span-1"
        >
          <StatCard
            title="Registered Bidders"
            value={total_registered_bidders}
            description={`${auction.registered_bidders.length} total entries`}
            icon={Users}
            variant="default"
            contentClassName="px-4 py-0 sm:px-6"
          />
          <StatCard
            title="Registration Fee"
            value={
              <>
                <span className="sm:hidden">
                  {formatNumberCompact(total_registration_fee)}
                </span>
                <span className="hidden sm:inline">
                  {formatNumberToCurrency(total_registration_fee)}
                </span>
              </>
            }
            description="Collected from registrations"
            icon={DollarSign}
            variant="primary"
            contentClassName="px-4 py-0 sm:px-6"
          />
          <StatCard
            title="Items Sold"
            value={payable_item_count}
            description={`${item_summary.paid_items} paid · ${item_summary.unpaid_items} unpaid`}
            icon={Package}
            variant="default"
            contentClassName="px-4 py-0 sm:px-6"
          />
          <StatCard
            title="Total Sales"
            value={
              <>
                <span className="sm:hidden">
                  {formatNumberCompact(item_summary.total_item_price)}
                </span>
                <span className="hidden sm:inline">
                  {formatNumberToCurrency(item_summary.total_item_price)}
                </span>
              </>
            }
            description={`+${formatNumberToCurrency(total_service_charge_amount)} service charge`}
            icon={TrendingUp}
            variant="success"
            contentClassName="px-4 py-0 sm:px-6"
          />
          <StatCard
            title="Avg Selling Price"
            value={
              payable_item_count
                ? formatNumberToCurrency(
                    Math.round(item_summary.total_item_price / payable_item_count),
                  )
                : "—"
            }
            description={
              payable_item_count
                ? `${formatNumberToCurrency(item_summary.total_item_price)} ÷ ${payable_item_count} items`
                : "No items sold yet"
            }
            icon={Tag}
            variant="default"
            contentClassName="px-4 py-0 sm:px-6"
          />
        </StatCardGroup>

        <div className="grid gap-[18px] lg:grid-cols-[1.55fr_1fr] 2xl:gap-6">
          {/* Wrap left column in a relative cell so the right column drives
              the row height; the table card stretches to fill it and scrolls. */}
          <div className="min-w-0 lg:relative lg:min-h-[420px]">
            <div className="lg:absolute lg:inset-0">
              <AuctionContainerSummaryTable
                containerSummary={container_summary}
              />
            </div>
          </div>

          <div className="flex flex-col gap-[18px] 2xl:gap-6">
            {/* Highest Item Sold spotlight */}
            <Card className="flex h-fit flex-col p-[18px] 2xl:p-5 2xl:text-[15px]">
              <div className="mb-3 flex items-center gap-2">
                <Gavel size={14} className="text-muted-foreground" />
                <span className="text-[13px] font-semibold 2xl:text-[16.5px]">
                  Highest Item Sold
                </span>
              </div>
              {highest_item ? (
                <>
                  <div className="font-mono text-[28px] font-semibold leading-tight tracking-tight text-primary 2xl:text-[34px]">
                    {formatNumberToCurrency(highest_item.price)}
                  </div>
                  {highest_item.description ? (
                    <div className="mt-1.5 text-[13.5px] font-medium text-foreground/80 2xl:text-[16px]">
                      {highest_item.description}
                    </div>
                  ) : null}
                  <div className="font-mono mt-0.5 text-[12px] text-muted-foreground 2xl:text-[14.5px]">
                    Sold to #{highest_item.bidder_number} · {highest_item.bidder_name}
                  </div>
                </>
              ) : (
                <div className="py-2 text-[13px] text-muted-foreground 2xl:text-[15px]">
                  No items sold yet.
                </div>
              )}
            </Card>

            {/* Item Summary */}
            <Card className="flex h-fit flex-col p-[18px] 2xl:p-5 2xl:text-[15px]">
              <div className="mb-3.5 flex items-center justify-between">
                <span className="text-[14px] font-semibold 2xl:text-[17.5px]">
                  Item Summary
                </span>
                <span className="text-[11px] text-muted-foreground 2xl:text-[14px]">
                  {payable_item_count} payable item
                  {payable_item_count === 1 ? "" : "s"}
                </span>
              </div>

              {/* Stacked paid/unpaid bar */}
              <div className="flex h-2 overflow-hidden rounded bg-secondary">
                <div
                  className="bg-status-success"
                  style={{ width: `${paid_item_percentage}%` }}
                />
                <div
                  className="bg-destructive"
                  style={{ width: `${unpaid_item_percentage}%` }}
                />
              </div>

              {/* Breakdown rows */}
              <div className="mt-3.5 flex flex-col gap-2.5">
                {[
                  {
                    label: "Paid",
                    count: item_summary.paid_items,
                    amount: item_summary.paid_amount,
                    pct: paid_item_percentage,
                    dot: "bg-status-success",
                    count_color: "text-foreground",
                  },
                  {
                    label: "Unpaid",
                    count: item_summary.unpaid_items,
                    amount: item_summary.unpaid_amount,
                    pct: unpaid_item_percentage,
                    dot: "bg-destructive",
                    count_color: "text-destructive",
                  },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline gap-2 text-[13px] 2xl:text-[15.5px]"
                  >
                    <span
                      className={cn(
                        "size-2 shrink-0 self-center rounded-full",
                        row.dot,
                      )}
                    />
                    <span className="flex-1 text-foreground/80">{row.label}</span>
                    <span className="font-mono text-[11.5px] text-muted-foreground 2xl:text-[14px]">
                      {formatNumberToCurrency(row.amount)}
                    </span>
                    <span
                      className={cn(
                        "font-mono min-w-[30px] text-right text-[14px] font-semibold 2xl:text-[17px]",
                        row.count_color,
                      )}
                    >
                      {row.count}
                    </span>
                    <span className="min-w-[36px] text-right text-[11.5px] text-muted-foreground 2xl:text-[14px]">
                      {row.pct}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Gross sales footer */}
              <div className="mt-4 flex items-baseline justify-between border-t pt-2.5">
                <span className="caps-label text-[11px] 2xl:text-[14px]">
                  Gross Sales
                </span>
                <span className="font-mono text-[18px] font-semibold 2xl:text-[22px]">
                  {formatNumberToCurrency(item_summary.total_item_price)}
                </span>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
