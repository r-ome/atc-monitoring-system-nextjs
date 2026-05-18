"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart";
import { AuctionKpiEntry } from "src/entities/models/Report";
import { cn, formatNumberToCurrency } from "@/app/lib/utils";

const chartConfig = {
  total_sales: { label: "Total Sales", color: "#22c55e" },
  highest_item_sold: { label: "Highest Item Sold", color: "#0ea5e9" },
  avg_selling_price: { label: "Avg Selling Price", color: "#8b5cf6" },
  total_registration_fee: { label: "Registration Fee", color: "#3b82f6" },
  items_sold: { label: "Items Sold", color: "#f97316" },
  registered_bidders: { label: "Registered Bidders", color: "#ef4444" },
} satisfies ChartConfig;

type KpiKey = keyof typeof chartConfig;

const KPI_KEYS = Object.keys(chartConfig) as KpiKey[];

const PESO_KEYS = new Set<KpiKey>([
  "total_sales",
  "highest_item_sold",
  "avg_selling_price",
  "total_registration_fee",
]);

const MUTED_COLOR = "#cbd5e1";

interface Props {
  data: AuctionKpiEntry[];
  year: string;
}

type NormalizedRow = AuctionKpiEntry & Record<`${KpiKey}_rel`, number>;

export const AuctionKpisChart = ({ data, year }: Props) => {
  const [activeKey, setActiveKey] = useState<KpiKey | null>(null);

  const { rows, peaks } = useMemo(() => {
    const peakMap: Record<KpiKey, number> = {
      total_sales: 0,
      highest_item_sold: 0,
      avg_selling_price: 0,
      total_registration_fee: 0,
      items_sold: 0,
      registered_bidders: 0,
    };
    for (const entry of data) {
      for (const key of KPI_KEYS) {
        if (entry[key] > peakMap[key]) peakMap[key] = entry[key];
      }
    }
    const normalized: NormalizedRow[] = data.map((entry) => {
      const next = { ...entry } as NormalizedRow;
      for (const key of KPI_KEYS) {
        const peak = peakMap[key];
        next[`${key}_rel` as `${KpiKey}_rel`] = peak > 0 ? entry[key] / peak : 0;
      }
      return next;
    });
    return { rows: normalized, peaks: peakMap };
  }, [data]);

  const toggle = (key: KpiKey) =>
    setActiveKey((current) => (current === key ? null : key));

  const isMuted = (key: KpiKey) => activeKey !== null && activeKey !== key;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Auction KPI Trends — {year}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-muted-foreground flex h-60 items-center justify-center text-sm">
            No auctions for {year}.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <ChartContainer
              config={chartConfig}
              className="min-h-[360px] w-full"
            >
              <LineChart
                data={rows}
                margin={{ top: 16, right: 24, bottom: 8, left: 8 }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="auction_date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => (v as number).toFixed(1)}
                  label={{
                    value: "Level Relative to Peak",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    style: { fontSize: 11, fill: "var(--muted-foreground)" },
                  }}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      className="border-slate-700 bg-slate-900 text-slate-50 [&_*]:text-slate-50"
                      formatter={(_value, name, item) => {
                        const relKey = name as `${KpiKey}_rel`;
                        const key = relKey.replace(/_rel$/, "") as KpiKey;
                        const entry = chartConfig[key];
                        const label = entry?.label ?? String(name);
                        const raw =
                          (item?.payload as NormalizedRow | undefined)?.[key] ??
                          0;
                        const formatted = PESO_KEYS.has(key)
                          ? formatNumberToCurrency(raw)
                          : raw.toLocaleString();
                        const peak = peaks[key];
                        const pct =
                          peak > 0 ? Math.round((raw / peak) * 100) : 0;
                        return (
                          <span className="flex w-full justify-between gap-3">
                            <span
                              style={{
                                color: isMuted(key) ? MUTED_COLOR : entry?.color,
                              }}
                            >
                              {label}
                            </span>
                            <span className="font-mono font-medium">
                              {formatted}
                              <span className="ml-2 text-slate-400">
                                ({pct}%)
                              </span>
                            </span>
                          </span>
                        );
                      }}
                    />
                  }
                />
                {KPI_KEYS.map((key) => {
                  const muted = isMuted(key);
                  const active = activeKey === key;
                  return (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={`${key}_rel`}
                      name={`${key}_rel`}
                      stroke={muted ? MUTED_COLOR : `var(--color-${key})`}
                      strokeOpacity={muted ? 0.3 : 1}
                      strokeWidth={active ? 7 : muted ? 1.5 : 2}
                      dot={false}
                      activeDot={{ r: active ? 9 : muted ? 3 : 5 }}
                      isAnimationActive={false}
                    />
                  );
                })}
              </LineChart>
            </ChartContainer>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {KPI_KEYS.map((key) => {
                const entry = chartConfig[key];
                const active = activeKey === key;
                const muted = isMuted(key);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggle(key)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-md border px-2 py-1 text-[12px] transition-colors",
                      active
                        ? "border-foreground/40 bg-secondary"
                        : "border-transparent hover:bg-secondary/60",
                    )}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-[2px]"
                      style={{
                        backgroundColor: muted ? MUTED_COLOR : entry.color,
                      }}
                    />
                    <span
                      style={{
                        color: muted ? MUTED_COLOR : entry.color,
                      }}
                    >
                      {entry.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
