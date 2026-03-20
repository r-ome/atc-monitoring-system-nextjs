"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/app/components/ui/chart";
import { AuctionComparisonEntry } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

const revenueConfig = {
  total_sales: {
    label: "Sales",
    color: "#22c55e",
  },
  total_registration_fee: {
    label: "Registration Fee",
    color: "#3b82f6",
  },
} satisfies ChartConfig;

const activityConfig = {
  total_items: {
    label: "Total Items",
    color: "#3b82f6",
  },
  items_sold: {
    label: "Items Sold",
    color: "#22c55e",
  },
  bidder_count: {
    label: "Bidders",
    color: "#f97316",
  },
} satisfies ChartConfig;

interface Props {
  data: AuctionComparisonEntry[];
}

export const AuctionComparisonChart = ({ data }: Props) => {
  if (data.length === 0) {
    return (
      <div className="text-muted-foreground flex h-40 items-center justify-center text-sm">
        No auction data for the selected period.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue per Auction</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={revenueConfig} className="min-h-[250px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="auction_date"
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
                    formatter={(value) =>
                      formatNumberToCurrency(value as number)
                    }
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="total_sales"
                fill="var(--color-total_sales)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="total_registration_fee"
                fill="var(--color-total_registration_fee)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Items & Bidders per Auction</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={activityConfig} className="min-h-[250px] w-full">
            <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="auction_date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="total_items"
                fill="var(--color-total_items)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="items_sold"
                fill="var(--color-items_sold)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="bidder_count"
                fill="var(--color-bidder_count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};
