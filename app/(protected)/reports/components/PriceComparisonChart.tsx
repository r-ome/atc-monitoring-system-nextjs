"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart";
import { PriceComparisonEntry } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";

const chartConfig = {
  avg_old_price: {
    label: "Avg Old Price",
    color: "#3b82f6",
  },
  avg_new_price: {
    label: "Avg New Price",
    color: "#22c55e",
  },
} satisfies ChartConfig;

interface Props {
  data: PriceComparisonEntry[];
}

export const PriceComparisonChart = ({ data }: Props) => {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        No bought item data for the selected period.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tick={{ fontSize: 11 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => formatNumberToCurrency(value as number)}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="avg_old_price" fill="var(--color-avg_old_price)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="avg_new_price" fill="var(--color-avg_new_price)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
};
