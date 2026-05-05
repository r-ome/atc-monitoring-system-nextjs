"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { InfoIcon } from "lucide-react";
import { computeContainerReport } from "./computeContainerReport";

interface ContainerReportProps {
  inventories: {
    auctions_inventory: {
      status: string;
      price: number;
      bidder?: { service_charge?: number | null } | null;
    } | null;
  }[];
}

function formatPeso(value: number): string {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ReportRow({
  label,
  hint,
  value,
  className,
}: {
  label: string;
  hint: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="size-3.5 text-muted-foreground/60 cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-60 whitespace-pre-line">
            {hint}
          </TooltipContent>
        </Tooltip>
      </div>
      <span className={`text-sm font-semibold tabular-nums ${className ?? ""}`}>
        {formatPeso(value)}
      </span>
    </div>
  );
}

export const ContainerReport: React.FC<ContainerReportProps> = ({
  inventories,
}) => {
  const {
    totalItemSales,
    totalServiceCharge,
    containerSalesCommission,
    atcGroupCommission,
    sortingFee,
    royalty,
    atcSales,
    totalProfit,
  } = computeContainerReport(inventories);

  const salesLabel =
    totalItemSales < 700_000
      ? "25% of total sales"
      : totalItemSales <= 799_999
        ? "20% of total sales"
        : "15% of total sales";

  const royaltyLabel =
    totalItemSales < 450_000
      ? "< ₱450,000 sales → ₱20,000"
      : totalItemSales < 500_000
        ? "₱450,000–₱499,999 sales → ₱22,000"
        : totalItemSales < 550_000
          ? "₱500,000–₱549,999 sales → ₱25,000"
          : totalItemSales < 700_000
            ? "₱550,000–₱699,999 sales → ₱30,000"
            : totalItemSales < 800_000
              ? "₱700,000–₱799,999 sales → ₱32,000"
              : "≥ ₱800,000 sales → ₱35,000";

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Container Sales Report</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <ReportRow
          label="Total Item Sales"
          hint="Sum of all PAID auction item prices in this container."
          value={totalItemSales}
          className="text-green-600"
        />

        <Separator className="my-2" />

        <ReportRow
          label="Container Sales Commission"
          hint={`Tiered rate applied to total sales:\n< ₱700,000 → 25%\n₱700,000–₱799,999 → 20%\n≥ ₱800,000 → 15%\n\nApplied rate: ${salesLabel}`}
          value={containerSalesCommission}
          className="text-orange-500"
        />
        <ReportRow
          label="ATC Group Commission"
          hint="Container Sales Commission ÷ 3"
          value={atcGroupCommission}
          className="text-orange-500"
        />
        <ReportRow
          label="Sorting / Preparation Fee"
          hint="5% of Total Item Sales"
          value={sortingFee}
          className="text-orange-500"
        />
        <ReportRow
          label="Royalty"
          hint={`Tiered flat amount based on total sales:\n< ₱450,000 → ₱20,000\n₱450,000–₱499,999 → ₱22,000\n₱500,000–₱549,999 → ₱25,000\n₱550,000–₱699,999 → ₱30,000\n₱700,000–₱799,999 → ₱32,000\n≥ ₱800,000 → ₱35,000\n\nApplied tier: ${royaltyLabel}`}
          value={royalty}
          className="text-orange-500"
        />

        <Separator className="my-2" />

        <ReportRow
          label="ATC Sales"
          hint="(Container Sales Commission − ATC Group Commission + Sorting Fee) − Royalty"
          value={atcSales}
          className={atcSales >= 0 ? "text-green-600" : "text-red-600"}
        />
        <ReportRow
          label="Service Charge"
          hint="Sum of each PAID item price multiplied by that item's registered bidder service charge rate."
          value={totalServiceCharge}
          className="text-green-600"
        />

        <Separator className="my-2" />

        <ReportRow
          label="Total Profit"
          hint="ATC Sales + Service Charge"
          value={totalProfit}
          className={totalProfit >= 0 ? "text-green-600" : "text-red-600"}
        />
      </CardContent>
    </Card>
  );
};
