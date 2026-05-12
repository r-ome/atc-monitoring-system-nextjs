"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { InfoIcon } from "lucide-react";

interface OwnerContainerInventory {
  status: string;
  auctions_inventory: {
    status: string;
    price: number;
    sale_year: number | null;
  } | null;
}

interface OwnerContainerReportProps {
  inventories: OwnerContainerInventory[];
}

const ALL_YEARS = "all";

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
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="size-3.5 text-muted-foreground/60 cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-60 whitespace-pre-line"
          >
            {hint}
          </TooltipContent>
        </Tooltip>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${className ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export const OwnerContainerReport: React.FC<OwnerContainerReportProps> = ({
  inventories,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const yearParam = searchParams.get("year");

  const availableYears = useMemo(() => {
    const set = new Set<number>();
    for (const inv of inventories) {
      const year = inv.auctions_inventory?.sale_year;
      if (year != null) set.add(year);
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [inventories]);

  const selectedYear =
    yearParam && yearParam !== ALL_YEARS && availableYears.includes(Number(yearParam))
      ? Number(yearParam)
      : null;

  const filteredPaidItems = useMemo(
    () =>
      inventories.flatMap((inv) => {
        const ai = inv.auctions_inventory;
        if (ai?.status !== "PAID") return [];
        if (selectedYear != null && ai.sale_year !== selectedYear) return [];
        return [ai];
      }),
    [inventories, selectedYear],
  );

  const totalSales = filteredPaidItems.reduce(
    (sum, item) => sum + (item.price ?? 0),
    0,
  );
  const itemsSold = filteredPaidItems.length;
  const itemsUnsold =
    selectedYear == null
      ? inventories.length - inventories.filter(
          (inv) => inv.auctions_inventory?.status === "PAID",
        ).length
      : null;

  const handleYearChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === ALL_YEARS) {
      params.delete("year");
    } else {
      params.set("year", value);
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  };

  return (
    <Card className="max-w-lg">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>Owner Sales Report</CardTitle>
        <Select
          value={selectedYear == null ? ALL_YEARS : String(selectedYear)}
          onValueChange={handleYearChange}
        >
          <SelectTrigger size="sm" className="w-32">
            <SelectValue placeholder="All years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_YEARS}>All years</SelectItem>
            {availableYears.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-1">
        <ReportRow
          label={
            selectedYear == null
              ? "Total Item Sales"
              : `Total Item Sales (${selectedYear})`
          }
          hint="Total amount earned from all items sold in this container. Since this is an owner container, every peso here counts as profit. When you select a year, only sales from that year are included."
          value={formatPeso(totalSales)}
          className="text-green-600"
        />

        <Separator className="my-2" />

        <ReportRow
          label="Items Sold"
          hint={
            selectedYear == null
              ? "Number of items in this container that have been sold and paid for."
              : `Number of items sold and paid for during ${selectedYear}.`
          }
          value={itemsSold.toLocaleString("en-PH")}
        />
        {itemsUnsold != null ? (
          <ReportRow
            label="Items Unsold"
            hint="Number of items in this container that are still waiting to be sold. This is a lifetime count and does not change with the year filter."
            value={itemsUnsold.toLocaleString("en-PH")}
          />
        ) : null}

        <Separator className="my-2" />

        <ReportRow
          label="Owner Profit"
          hint="Same as Total Item Sales. Owner containers have no supplier deductions, commissions, or royalties applied to them."
          value={formatPeso(totalSales)}
          className="text-green-600"
        />
      </CardContent>
    </Card>
  );
};
