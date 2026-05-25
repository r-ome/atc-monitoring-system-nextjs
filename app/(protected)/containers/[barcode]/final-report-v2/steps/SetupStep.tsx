"use client";

import { useEffect, useMemo } from "react";
import { Container, Receipt, Sparkles } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { computeFinalReportBreakdown } from "../../components/report/computeFinalReportBreakdown";
import { StepHeading } from "../shared/StepHeading";
import { daysFromToday, formatAuctionRange, peso } from "../shared/format";
import type { V2StepProps } from "../shared/types";

type PerfTileProps = {
  label: string;
  value: string;
  sub?: string | null;
  tone?: "neutral" | "warn";
};

const PerfTile = ({ label, value, sub, tone = "neutral" }: PerfTileProps) => (
  <div className="flex flex-col gap-1.5 rounded-[10px] border bg-background px-4 py-3.5">
    <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
      {label}
    </span>
    <span
      className={`font-mono text-[20px] font-semibold tracking-[-0.02em] ${
        tone === "warn" ? "text-amber-700 dark:text-amber-400" : "text-foreground"
      }`}
    >
      {value}
    </span>
    {sub ? (
      <span className="text-[11.5px] text-muted-foreground">{sub}</span>
    ) : null}
  </div>
);

type BreakdownRow = {
  label: string;
  value: number;
  tone?: "neutral" | "sub" | "add" | "muted" | "total" | "accent";
};

const formatSign = (n: number, tone: BreakdownRow["tone"]): string => {
  if (tone === "sub") return `−${peso(Math.abs(n)).replace("₱", "₱")}`;
  if (tone === "add") return `+${peso(n)}`;
  return peso(n);
};

const BreakdownLine = ({ label, value, tone = "neutral" }: BreakdownRow) => {
  const valueColor =
    tone === "sub"
      ? "text-destructive"
      : tone === "add"
        ? "text-emerald-600 dark:text-emerald-400"
        : tone === "accent"
          ? "text-primary"
          : tone === "muted"
            ? "text-muted-foreground"
            : "text-foreground";
  return (
    <div className="flex items-center justify-between py-2.5">
      <span
        className={`text-[13px] ${
          tone === "total"
            ? "font-semibold text-foreground"
            : tone === "muted"
              ? "text-muted-foreground"
              : "text-foreground/90"
        }`}
      >
        {label}
      </span>
      <span
        className={`font-mono text-[13px] ${
          tone === "total" ? "font-semibold" : ""
        } ${valueColor}`}
      >
        {formatSign(value, tone)}
      </span>
    </div>
  );
};

export const SetupStep = ({
  preview,
  refresh,
  state,
  draftLoaded,
  goNext,
  container,
  breakdownInventories,
}: V2StepProps) => {
  // Build the preview once on mount so KPIs populate. We intentionally do
  // NOT call saveDraft here: V2Wizard's getFinalReportDraft also runs on
  // mount, so writing the initial (empty) draft now would race with — and
  // clobber — any existing saved draft. The server's preview endpoint
  // applies whatever draft is currently in the DB, so refresh() alone gives
  // us the right numbers.
  useEffect(() => {
    if (preview) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const auctionDates = useMemo(
    () =>
      preview
        ? Object.keys(preview.auction_dates)
            .filter((d) => d && d !== "---")
            .sort()
        : [],
    [preview],
  );

  const monitoring = preview?.report.monitoring ?? [];
  const soldCount = monitoring.length;
  const unsoldCount = preview?.unsold_items.length ?? 0;
  const totalSales = monitoring.reduce((sum, row) => {
    const p = row.was_bought_item && row.bought_item_price != null
      ? row.bought_item_price
      : row.price;
    return sum + p;
  }, 0);

  // Container Sales Report breakdown — uses the same computation as the
  // Reports tab's FinalReportBreakdown card. Tax deduction total here is the
  // sum of the in-progress draft's tax_edits.
  const draftTaxTotal = state.draft.tax_edits.reduce(
    (sum, e) => sum + e.deducted_amount,
    0,
  );
  const breakdown = computeFinalReportBreakdown(
    breakdownInventories,
    draftTaxTotal,
  );

  const reportDueDate = useMemo(() => {
    if (auctionDates.length === 0) return null;
    const latest = new Date(auctionDates[auctionDates.length - 1]);
    latest.setDate(latest.getDate() + 30);
    return latest;
  }, [auctionDates]);

  return (
    <div className="mx-auto w-full max-w-[920px] p-7">
      <StepHeading
        n={1}
        title="Generate the final report for this container"
        sub="Review the numbers below before we build the report. The next step lets you fix unsold items and check every row."
      />

      {/* Container header card */}
      <Card className="mb-4 flex flex-row items-center gap-3.5 p-[18px]">
        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-[10px] bg-primary/10 text-primary">
          <Container size={22} />
        </div>
        <div className="flex-1 leading-tight">
          <div className="text-[17px] font-semibold">
            Container{" "}
            <span className="font-mono">{container.barcode}</span> ·{" "}
            {container.supplier.name}
          </div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            {container.branch_name ? `${container.branch_name} branch` : "—"}
          </div>
        </div>
        <span className="rounded-md bg-emerald-100 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.04em] text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          READY
        </span>
      </Card>

      {/* KPI strip */}
      <section className="mb-1.5">
        <h2 className="text-[13px] font-semibold">Auction performance</h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">
          What happened across the auction days for this container.
        </p>
      </section>
      <div className="mb-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <PerfTile
          label="Auctioned on"
          value={formatAuctionRange(auctionDates)}
          sub={
            auctionDates.length > 0
              ? `${auctionDates.length} auction day${auctionDates.length === 1 ? "" : "s"}`
              : "—"
          }
        />
        <PerfTile
          label="Report due"
          value={
            reportDueDate
              ? reportDueDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"
          }
          sub={
            reportDueDate
              ? `${daysFromToday(reportDueDate)} days from today`
              : null
          }
        />
        <PerfTile
          label="Sold items"
          value={String(soldCount)}
          sub={unsoldCount > 0 ? `${unsoldCount} unsold` : null}
          tone={unsoldCount > 0 ? "warn" : "neutral"}
        />
        <PerfTile
          label="Total item sales"
          value={peso(totalSales)}
          sub="paid + unpaid hammer price"
        />
      </div>

      {/* Duties & taxes card */}
      <Card className="mb-4 flex flex-row items-center gap-3.5 px-[18px] py-3.5">
        <div className="flex h-[34px] w-[34px] items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Receipt size={16} />
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-semibold">
            Duties &amp; taxes paid on this container
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            BOC clearance, customs, brokerage · already deducted before sales
            calc
          </div>
        </div>
        <div className="font-mono text-[18px] font-semibold tracking-[-0.01em]">
          {container.duties_and_taxes > 0
            ? peso(container.duties_and_taxes)
            : "—"}
        </div>
      </Card>

      {/* Container Sales Report breakdown */}
      <section className="mb-1.5 flex items-center justify-between">
        <div>
          <h2 className="text-[13px] font-semibold">Container Sales Report</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">
            This is how the totals on the final report will be calculated.
          </p>
        </div>
      </section>
      <Card className="mb-5 divide-y px-5 py-1">
        <div>
          <BreakdownLine
            label="All PAID item sales"
            value={breakdown.paidItemSalesTotal}
            tone="neutral"
          />
          {breakdown.atcAllocatedPaidTotal > 0 ? (
            <BreakdownLine
              label="Less ATC-allocated PAID items"
              value={breakdown.atcAllocatedPaidTotal}
              tone="sub"
            />
          ) : null}
          <BreakdownLine
            label="Container Sales Report total"
            value={breakdown.reportsTabTotal}
            tone="total"
          />
        </div>
        <div>
          {breakdown.paidWithoutAuctionDateTotal > 0 ? (
            <BreakdownLine
              label="Less paid items without auction date"
              value={breakdown.paidWithoutAuctionDateTotal}
              tone="sub"
            />
          ) : null}
          {breakdown.excludedBidder740Total > 0 ? (
            <BreakdownLine
              label="Less Bidder 0740 items"
              value={breakdown.excludedBidder740Total}
              tone="sub"
            />
          ) : null}
          <BreakdownLine
            label="Original Final Report total"
            value={breakdown.originalFinalReportTotal}
            tone="total"
          />
        </div>
        <div>
          {breakdown.taxDeductionTotal > 0 ? (
            <BreakdownLine
              label="Less Tax Step deductions"
              value={breakdown.taxDeductionTotal}
              tone="sub"
            />
          ) : (
            <BreakdownLine
              label="No Tax Step deductions yet"
              value={0}
              tone="muted"
            />
          )}
          <BreakdownLine
            label="Modified Final Report total"
            value={breakdown.modifiedFinalReportTotal}
            tone="accent"
          />
        </div>
      </Card>

      {/* Footer callout. Gated on draftLoaded to mirror the footer / step
          rail — otherwise an early click could land the user on Resolve
          before getFinalReportDraft returns, and a staged action would
          overwrite the saved draft with the in-memory default. */}
      <button
        type="button"
        onClick={() => void goNext()}
        disabled={!draftLoaded}
        className="flex w-full items-start gap-2.5 rounded-[10px] bg-primary/10 px-4 py-3.5 text-left text-[13px] text-foreground/90 transition hover:bg-primary/15 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary/10"
      >
        <Sparkles size={16} className="mt-[2px] shrink-0 text-primary" />
        <span>
          <span className="font-semibold">Heads up:</span> Nothing is final
          yet. Continue to review every item
          {unsoldCount > 0
            ? ` — including the ${unsoldCount} unsold ${unsoldCount === 1 ? "one" : "ones"} that still need a decision.`
            : "."}
        </span>
      </button>
    </div>
  );
};
