"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/app/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { formatNumberToCurrency } from "@/app/lib/utils";
import type { AuctionBranchComparison, AuctionBranchMetrics, AuctionKpiEntry } from "src/entities/models/Report";
import { getAuctionBranchComparison } from "../actions";

const METRICS = [
  { key: "total_sales", label: "Total sales", currency: true },
  { key: "items_sold", label: "Items sold", currency: false },
  { key: "bidder_attendances", label: "Bidder attendances", currency: false },
  { key: "total_registration_fee", label: "Registration fees", currency: true },
  { key: "highest_item_sold", label: "Highest item sold", currency: true },
  { key: "avg_selling_price", label: "Average selling price", currency: true },
  { key: "auction_count", label: "Auction count", currency: false },
] as const satisfies ReadonlyArray<{ key: keyof AuctionBranchMetrics; label: string; currency: boolean }>;
const BRANCH_COLORS = ["#2563eb", "#ea580c", "#16a34a", "#9333ea", "#e11d48", "#0891b2", "#a16207"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type MetricKey = (typeof METRICS)[number]["key"];
function auctionValue(auction: AuctionKpiEntry, key: MetricKey): number {
  if (key === "bidder_attendances") return auction.registered_bidders;
  if (key === "auction_count") return 1;
  return auction[key];
}
type ComparisonState =
  | { status: "loading"; year: string }
  | { status: "error"; year: string; message: string }
  | { status: "ready"; data: AuctionBranchComparison };

interface Props {
  year: string;
  active: boolean;
}

export default function AuctionBranchComparison({ year, active }: Props) {
  const [state, setState] = useState<ComparisonState>({ status: "loading", year });
  const [retry, setRetry] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [metricKey, setMetricKey] = useState<MetricKey>("total_sales");
  const [comparisonMode, setComparisonMode] = useState<"monthly" | "auction">("monthly");

  useEffect(() => {
    if (!active) return;
    let current = true;
    setState((previous) => previous.status === "ready" && previous.data.year === year
      ? previous : { status: "loading", year });
    // A completed result survives view toggles. New years and retries request fresh data.
    if (state.status === "ready" && state.data.year === year) return;
    getAuctionBranchComparison({ year }).then((result) => {
      if (!current) return;
      if (result.ok) {
        setSelectedIds(null);
        setState({ status: "ready", data: result.value });
      } else {
        setState({ status: "error", year, message: result.error.message });
      }
    }).catch(() => {
      if (current) setState({ status: "error", year, message: "Failed to load branch comparison. Please try again." });
    });
    return () => { current = false; };
    // State is the result of this request. It must not trigger another request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, active, retry]);

  const data = state.status === "ready" && state.data.year === year ? state.data : null;
  const branches = useMemo(() => data?.branches.filter((branch) =>
    selectedIds === null || selectedIds.includes(branch.branch_id)) ?? [], [data, selectedIds]);
  const auctionMetrics = METRICS.filter((entry) => entry.key !== "auction_count").map((entry) => ({
    ...entry, label: entry.key === "bidder_attendances" ? "Registered bidders" : entry.label,
  }));
  const metrics = comparisonMode === "auction" ? auctionMetrics : METRICS;
  const metric = metrics.find((entry) => entry.key === metricKey) ?? metrics[0];
  const colors = useMemo(() => new Map(data?.branches.map((branch, index) =>
    [branch.branch_id, BRANCH_COLORS[index % BRANCH_COLORS.length]]) ?? []), [data]);
  const chartConfig: ChartConfig = Object.fromEntries(branches.map((branch) => [branch.branch_id, {
    label: branch.branch_name, color: colors.get(branch.branch_id),
  }]));
  const auctionCount = branches.reduce((maximum, branch) => Math.max(maximum, branch.auctions.length), 0);
  const chartRows = useMemo(() => comparisonMode === "auction"
    ? Array.from({ length: auctionCount }, (_, index) => ({
      label: `Auction ${index + 1}`, sequence: index + 1,
      ...Object.fromEntries(branches.map((branch) => [branch.branch_id, branch.auctions[index]
        ? auctionValue(branch.auctions[index], metric.key) : null])),
    }))
    : MONTH_LABELS.map((month, index) => ({
      label: month,
      ...Object.fromEntries(branches.map((branch) => [branch.branch_id, branch.months[index][metric.key]])),
    })), [comparisonMode, auctionCount, branches, metric.key]);
  const formatValue = (value: number, currency: boolean) => currency
    ? formatNumberToCurrency(value) : value.toLocaleString();

  if (!data) {
    return state.status === "error" && state.year === year ? (
      <Card><CardContent className="flex flex-col items-start gap-3 py-6">
        <p role="alert" className="text-sm">{state.message}</p>
        <Button type="button" variant="outline" onClick={() => setRetry((value) => value + 1)}>Retry</Button>
      </CardContent></Card>
    ) : <p role="status" className="text-muted-foreground py-8 text-sm">Loading branch comparison for {year}…</p>;
  }

  if (data.branches.length === 0) {
    return <p className="text-muted-foreground py-8 text-sm">No active branches are available for comparison.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader><CardTitle className="text-base">Branch comparison — {year}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">{comparisonMode === "auction"
            ? "Compare each branch’s first auction, then second, in date order within the selected year. Auction dates can differ between branches."
            : "Monthly results for the selected year."} Dates use Asia/Manila.</p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="auction-comparison-mode">Compare by</label>
              <Select value={comparisonMode} onValueChange={(value) => {
                if (value !== "monthly" && value !== "auction") return;
                setComparisonMode(value);
                if (value === "auction" && metricKey === "auction_count") setMetricKey("total_sales");
              }}>
                <SelectTrigger id="auction-comparison-mode" className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="auction">Per auction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" htmlFor="auction-comparison-metric">Metric</label>
              <Select value={metricKey} onValueChange={(value) => {
                const selected = metrics.find((entry) => entry.key === value);
                if (selected) setMetricKey(selected.key);
              }}>
                <SelectTrigger id="auction-comparison-metric" className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>{metrics.map((entry) => (
                  <SelectItem key={entry.key} value={entry.key}>{entry.label}</SelectItem>
                ))}</SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" onClick={() => setSelectedIds(null)}>Select all branches</Button>
          </div>
          <fieldset className="flex flex-wrap gap-x-5 gap-y-3">
            <legend className="mb-2 text-sm font-medium">Branches</legend>
            {data.branches.map((branch) => (
              <label key={branch.branch_id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" aria-label={branch.branch_name}
                  checked={selectedIds === null || selectedIds.includes(branch.branch_id)}
                  onChange={(event) => {
                    const checked = event.target.checked;
                    setSelectedIds((previous) => {
                      const ids = previous ?? data.branches.map((entry) => entry.branch_id);
                      return checked ? [...new Set([...ids, branch.branch_id])] : ids.filter((id) => id !== branch.branch_id);
                    });
                  }} />
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors.get(branch.branch_id) }} />
                {branch.branch_name}
              </label>
            ))}
          </fieldset>
          {branches.length === 0 ? (
            <p className="text-muted-foreground py-8 text-sm">Select at least one branch to compare.</p>
          ) : branches.every((branch) => branch.summary.auction_count === 0) ? (
            <p className="text-muted-foreground py-8 text-sm">No auctions for the selected branches in {year}.</p>
          ) : active ? (
            <ChartContainer config={chartConfig} className="h-[360px] w-full"
              aria-label={`${metric.label} by branch and ${comparisonMode === "auction" ? "auction sequence" : "month"}`}>
              <LineChart data={chartRows} margin={{ top: 12, right: 16, bottom: 8, left: 16 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis width={90} domain={[0, "auto"]} allowDecimals={metric.currency}
                  tickLine={false} axisLine={false}
                  tickFormatter={(value: number) => `${metric.currency ? "₱" : ""}${new Intl.NumberFormat("en", { notation: "compact" }).format(value)}`} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value, name, item) => (
                  <span className="flex w-full justify-between gap-4">
                    <span>{chartConfig[String(name)]?.label ?? String(name)}
                      {comparisonMode === "auction" && <span className="ml-2 text-muted-foreground">
                        {branches.find((branch) => branch.branch_id === String(name))
                          ?.auctions[Number(item.payload.sequence) - 1]?.auction_date}
                      </span>}
                    </span>
                    <span className="font-mono">{formatValue(Number(value), metric.currency)}</span>
                  </span>
                )} />} />
                {branches.map((branch) => (
                  <Line key={branch.branch_id} dataKey={branch.branch_id} type="linear"
                    stroke={colors.get(branch.branch_id)} strokeWidth={2.5}
                    dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
                ))}
              </LineChart>
            </ChartContainer>
          ) : null}
          <p className="text-muted-foreground text-xs">Average selling price = total sales ÷ items sold. Bidder attendances count each bidder once per auction.</p>
        </CardContent>
      </Card>
      {comparisonMode === "auction" && auctionCount > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Per-auction branch comparison — {year}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Auction sequence</TableHead><TableHead>Branch</TableHead><TableHead>Date</TableHead>
                {auctionMetrics.map((entry) => <TableHead key={entry.key} className="text-right">{entry.label}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>{Array.from({ length: auctionCount }, (_, index) => branches.map((branch) => {
                const auction = branch.auctions[index];
                return <TableRow key={`${index}-${branch.branch_id}`}>
                  <TableCell className="whitespace-nowrap">Auction {index + 1}</TableCell>
                  <TableCell className="font-medium">{branch.branch_name}</TableCell>
                  <TableCell className="whitespace-nowrap">{auction?.auction_date ?? "No auction"}</TableCell>
                  {auctionMetrics.map((entry) => <TableCell key={entry.key} className="text-right tabular-nums">
                    {auction ? formatValue(auctionValue(auction, entry.key), entry.currency) : "—"}
                  </TableCell>)}
                </TableRow>;
              }))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      {branches.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Yearly branch summary — {year}</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Branch</TableHead>
                {METRICS.map((entry) => <TableHead key={entry.key} className="text-right">{entry.label}</TableHead>)}
              </TableRow></TableHeader>
              <TableBody>{branches.map((branch) => (
                <TableRow key={branch.branch_id}>
                  <TableCell className="font-medium">{branch.branch_name}</TableCell>
                  {METRICS.map((entry) => <TableCell key={entry.key} className="text-right tabular-nums">
                    {formatValue(branch.summary[entry.key], entry.currency)}
                  </TableCell>)}
                </TableRow>
              ))}</TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
