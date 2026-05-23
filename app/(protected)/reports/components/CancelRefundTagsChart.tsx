"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart";
import {
  CANCEL_REFUND_TAG_LABELS,
  CANCEL_REFUND_TAG_VALUES,
  CancelRefundTag,
} from "src/entities/models/InventoryHistoryRemark";
import { RefundCancellationEntry } from "src/entities/models/Report";

const chartConfig = {
  cancelled: { label: "Cancelled", color: "#ef4444" },
  refunded: { label: "Refunded", color: "#f59e0b" },
} satisfies ChartConfig;

interface Props {
  data: RefundCancellationEntry[];
}

export const CancelRefundTagsChart = ({ data }: Props) => {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        No cancellation or refund data for the selected period.
      </div>
    );
  }

  const counts = CANCEL_REFUND_TAG_VALUES.map((tag) => {
    const rows = data.filter((d) => (d.tag ?? "OTHER") === tag);
    return {
      tag: tag as CancelRefundTag,
      label: CANCEL_REFUND_TAG_LABELS[tag],
      cancelled: rows.filter((d) => d.status === "CANCELLED").length,
      refunded: rows.filter((d) => d.status === "REFUNDED").length,
      total: rows.length,
    };
  })
    .filter((row) => row.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <ChartContainer config={chartConfig} className="min-h-[280px] w-full">
      <BarChart
        data={counts}
        layout="vertical"
        margin={{ top: 8, right: 32, bottom: 8, left: 8 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={150}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="cancelled" stackId="a" fill="var(--color-cancelled)" />
        <Bar dataKey="refunded" stackId="a" fill="var(--color-refunded)">
          <LabelList
            dataKey="total"
            position="right"
            className="text-xs fill-foreground"
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
};
