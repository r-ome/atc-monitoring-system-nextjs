"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Gavel } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { cn, formatDate, formatNumberCompact } from "@/app/lib/utils";
import { getAuctionCalendarStatistics } from "@/app/(protected)/auctions/actions";
import { getFullMonthFetchRange } from "@/app/(protected)/auctions/calendar-range";
import type { AuctionsStatistics } from "src/entities/models/Statistics";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

const INITIAL_LOOKBACK_MONTHS = 2;

function AuctionDaySummary({
  auction,
  muted,
}: {
  auction: AuctionsStatistics;
  muted: boolean;
}) {
  const registeredBidders = Math.max(auction.total_registered_bidders - 1, 0);
  const unpaidBidders = Math.min(
    Math.max(auction.total_bidders_with_balance, 0),
    registeredBidders,
  );
  const paidBidders = Math.max(registeredBidders - unpaidBidders, 0);
  const paidPercentage =
    registeredBidders > 0 ? (paidBidders / registeredBidders) * 100 : 0;
  const totalSales = formatNumberCompact(auction.total_sales);

  if (unpaidBidders === 0) {
    return (
      <div
        className={cn(
          "rounded border border-status-success/25 bg-status-success/5 px-2 py-1.5",
          muted && "opacity-60",
        )}
        title={`All bidders paid. Total sales ${totalSales}`}
      >
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold leading-tight 2xl:text-[13px]">
          <span className="truncate text-status-success">All paid</span>
          <span className="truncate text-foreground">{totalSales}</span>
        </div>
        <div className="mt-0.5 text-[10px] leading-tight text-muted-foreground 2xl:text-[12px]">
          {registeredBidders} bidder{registeredBidders === 1 ? "" : "s"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded border bg-background/95 px-2 py-1.5",
        muted && "opacity-60",
      )}
      title={`${paidBidders} paid, ${unpaidBidders} unpaid. Total sales ${totalSales}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-[11px] font-medium leading-tight 2xl:text-[13px]">
        <span className="truncate text-status-success">{paidBidders} paid</span>
        <span className="truncate text-destructive">{unpaidBidders} left</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-destructive/20">
        <div
          className="h-full rounded-full bg-status-success"
          style={{ width: `${paidPercentage}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] leading-tight text-muted-foreground 2xl:text-[12px]">
        <span>
          {registeredBidders} bidder{registeredBidders === 1 ? "" : "s"}
        </span>
        <span className="font-medium text-foreground">{totalSales}</span>
      </div>
    </div>
  );
}

function getAuctionStatus(auction: AuctionsStatistics) {
  const registeredBidders = Math.max(auction.total_registered_bidders - 1, 0);
  const unpaidBidders = Math.min(
    Math.max(auction.total_bidders_with_balance, 0),
    registeredBidders,
  );
  const paidBidders = Math.max(registeredBidders - unpaidBidders, 0);

  return {
    registeredBidders,
    unpaidBidders,
    paidBidders,
    totalSales: formatNumberCompact(auction.total_sales),
  };
}

export default function Page() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [auctionsByDate, setAuctionsByDate] = useState<
    Record<string, AuctionsStatistics>
  >({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const loadedMonthKeysRef = useRef(new Set<string>());
  const inflightMonthKeysRef = useRef(new Set<string>());
  const hasRequestedInitialRangeRef = useRef(false);

  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const mobileAuctions = useMemo(
    () =>
      cells
        .filter((day) => isSameMonth(day, currentMonth))
        .map((day) => {
          const key = formatDate(day, "yyyy-MM-dd");
          const auction = auctionsByDate[key];
          return auction ? { day, key, auction } : null;
        })
        .filter(
          (
            entry,
          ): entry is {
            day: Date;
            key: string;
            auction: AuctionsStatistics;
          } => Boolean(entry),
        ),
    [auctionsByDate, cells, currentMonth],
  );

  const handleVisibleRangeChange = useCallback(
    async (range: { start: Date; end: Date }) => {
      const initialStart = startOfMonth(
        subMonths(new Date(), INITIAL_LOOKBACK_MONTHS),
      );
      const shouldRequestInitialRange =
        !hasRequestedInitialRangeRef.current && range.end >= initialStart;
      const requestedRange = getFullMonthFetchRange(
        shouldRequestInitialRange ? initialStart : range.start,
        range.end,
      );
      const { fetchStart, fetchEnd, monthKeys: requestedMonthKeys } =
        requestedRange;
      const missingMonthKeys = requestedMonthKeys.filter(
        (key) =>
          !loadedMonthKeysRef.current.has(key) &&
          !inflightMonthKeysRef.current.has(key),
      );

      if (missingMonthKeys.length === 0) return;

      if (shouldRequestInitialRange) {
        hasRequestedInitialRangeRef.current = true;
      }
      missingMonthKeys.forEach((key) => inflightMonthKeysRef.current.add(key));
      setIsLoadingStats(true);

      const result = await getAuctionCalendarStatistics(
        fetchStart.toISOString(),
        fetchEnd.toISOString(),
      );

      missingMonthKeys.forEach((key) =>
        inflightMonthKeysRef.current.delete(key),
      );
      if (result.ok) {
        setAuctionsByDate((current) => {
          const next = { ...current };
          for (const auction of result.value) {
            next[auction.auction_date_iso] = auction;
          }
          return next;
        });
        requestedMonthKeys.forEach((key) =>
          loadedMonthKeysRef.current.add(key),
        );
      }

      setIsLoadingStats(inflightMonthKeysRef.current.size > 0);
    },
    [],
  );

  useEffect(() => {
    void handleVisibleRangeChange({
      start: cells[0],
      end: cells[cells.length - 1],
    });
  }, [cells, handleVisibleRangeChange]);

  const headerActions = useMemo(
    () =>
      isLoadingStats ? (
        <span className="text-xs text-muted-foreground">
          Loading auction stats...
        </span>
      ) : null,
    [isLoadingStats],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Auctions"
        subtitle="Choose the date of the auction"
      />

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <Gavel size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            Auction Calendar
          </span>
        </div>

        <div className="overflow-hidden rounded-md border">
          <div className="flex flex-col gap-3 border-b px-4 py-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
                <h1 className="p-1 text-xs uppercase text-muted-foreground">
                  {format(new Date(), "MMM")}
                </h1>
                <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
                  <span>{format(new Date(), "d")}</span>
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground 2xl:text-xl">
                  {format(currentMonth, "MMMM, yyyy")}
                </h2>
                <p className="text-sm text-muted-foreground 2xl:text-base">
                  {format(startOfMonth(currentMonth), "MMM d, yyyy")} -{" "}
                  {format(endOfMonth(currentMonth), "MMM d, yyyy")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 md:justify-end">
              {headerActions}
              <div className="inline-flex -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse">
                <Button
                  onClick={() => setCurrentMonth((month) => subMonths(month, 1))}
                  className="shrink-0 rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                  variant="outline"
                  size="icon"
                  aria-label="Navigate to previous month"
                >
                  <ChevronLeft size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
                <Button
                  onClick={() => setCurrentMonth(new Date())}
                  className="min-w-0 flex-1 rounded-none shadow-none focus-visible:z-10 md:flex-none md:w-auto"
                  variant="outline"
                >
                  Today
                </Button>
                <Button
                  onClick={() => setCurrentMonth((month) => addMonths(month, 1))}
                  className="shrink-0 rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
                  variant="outline"
                  size="icon"
                  aria-label="Navigate to next month"
                >
                  <ChevronRight size={16} strokeWidth={2} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden grid-cols-7 border-b bg-muted/40 md:grid">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
              <div
                key={day}
                className={cn(
                  "caps-label border-r px-2 py-1.5 text-[11px] 2xl:text-[15px]",
                  index === 6 && "border-r-0",
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="hidden grid-cols-7 md:grid">
            {cells.map((day, index) => {
              const key = formatDate(day, "yyyy-MM-dd");
              const auction = auctionsByDate[key];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => router.push(`/auctions/${key}`)}
                  className={cn(
                    "min-h-[92px] border-b border-r p-1.5 text-left transition-colors hover:bg-accent/75 focus:z-10 2xl:min-h-[122px] 2xl:p-2",
                    !isCurrentMonth && "bg-muted/40",
                    today && "bg-blue-50 dark:bg-blue-950/30",
                    (index + 1) % 7 === 0 && "border-r-0",
                  )}
                >
                  <div className="mb-1 flex justify-end">
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded text-[12px] font-medium 2xl:text-[16px]",
                        !isCurrentMonth
                          ? "text-muted-foreground"
                          : "text-foreground",
                      )}
                      style={
                        today
                          ? {
                              background: "var(--primary)",
                              color: "var(--primary-foreground)",
                            }
                          : undefined
                      }
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {auction && (
                    <AuctionDaySummary
                      auction={auction}
                      muted={!isCurrentMonth}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="grid gap-2 bg-background p-3 md:hidden">
            {mobileAuctions.length > 0 ? (
              mobileAuctions.map(({ day, key, auction }) => {
                const status = getAuctionStatus(auction);
                const allPaid = status.unpaidBidders === 0;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => router.push(`/auctions/${key}`)}
                    className="flex items-center gap-3 rounded-md border bg-background p-3 text-left transition-colors hover:bg-accent/75"
                  >
                    <div
                      className={cn(
                        "flex w-12 shrink-0 flex-col items-center rounded-md border bg-muted/50 py-1",
                        isToday(day) && "border-primary bg-primary/10",
                      )}
                    >
                      <span className="text-[10px] font-medium uppercase text-muted-foreground">
                        {format(day, "EEE")}
                      </span>
                      <span className="text-lg font-semibold leading-none">
                        {format(day, "d")}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            allPaid ? "text-status-success" : "text-foreground",
                          )}
                        >
                          {allPaid
                            ? "All paid"
                            : `${status.unpaidBidders} unpaid left`}
                        </span>
                        <span className="shrink-0 text-sm font-semibold">
                          {status.totalSales}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {status.paidBidders} paid / {status.registeredBidders}{" "}
                        bidders
                      </div>
                      {!allPaid && (
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-destructive/20">
                          <div
                            className="h-full rounded-full bg-status-success"
                            style={{
                              width:
                                status.registeredBidders > 0
                                  ? `${(status.paidBidders / status.registeredBidders) * 100}%`
                                  : "0%",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                No auctions scheduled for this month.
              </div>
            )}
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
