"use client";

import { ReactNode } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { BranchBadge } from "@/app/components/admin";
import { ArrowUpDown } from "lucide-react";
import { formatDate } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { SupplierContainerRow } from "./SupplierContainersTable";

function formatPeso(value: number): string {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function CalculationTooltip({
  children,
  className,
  result,
  resultLabel,
  side = "top",
}: {
  children: ReactNode;
  className: string;
  result: number;
  resultLabel: string;
  side?: "top" | "left";
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`cursor-help font-medium underline decoration-dotted ${className}`}
        >
          {formatPeso(result)}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-h-48 max-w-96 overflow-y-auto whitespace-normal px-3.5 py-2.5 text-xs"
      >
        <div className="grid grid-cols-[1rem_minmax(7rem,max-content)_auto] items-baseline gap-x-3 gap-y-1.5">
          {children}
          <div className="col-span-3 my-0.5 border-t border-white/40" />
          <CalculationRow
            operator="="
            value={formatPeso(result)}
            label={resultLabel}
            emphasized
          />
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

function CalculationRow({
  operator,
  value,
  label,
  emphasized = false,
}: {
  operator?: string;
  value: ReactNode;
  label?: string;
  emphasized?: boolean;
}) {
  const valueClassName = emphasized
    ? "font-semibold text-white"
    : "text-white";

  return (
    <>
      <span className={`text-right ${valueClassName}`}>{operator}</span>
      <span className={`text-right tabular-nums ${valueClassName}`}>
        {value}
      </span>
      <span className="whitespace-nowrap text-primary-foreground/70">
        {label ? `(${label})` : null}
      </span>
    </>
  );
}

function groupPaidItemPrices(prices: number[]) {
  return Array.from(
    prices.reduce((groups, price) => {
      groups.set(price, (groups.get(price) ?? 0) + 1);
      return groups;
    }, new Map<number, number>()),
  );
}

function SortableHeader({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="flex justify-center">
      <Button variant="ghost" className="cursor-pointer" onClick={onClick}>
        {label}
        <ArrowUpDown />
      </Button>
    </div>
  );
}

export const supplierContainerColumns: ColumnDef<SupplierContainerRow>[] = [
  {
    accessorKey: "barcode",
    header: ({ column }) => (
      <SortableHeader
        label="Barcode"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.barcode}</div>
    ),
  },
  {
    accessorKey: "total_item_sales",
    header: ({ column }) => (
      <SortableHeader
        label="Item Sales"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const { paid_item_prices, total_item_sales } = row.original;
      const groupedPrices = groupPaidItemPrices(paid_item_prices);
      return (
        <div className="flex justify-center">
          <CalculationTooltip
            className="text-green-600"
            result={total_item_sales}
            resultLabel="total item sales"
          >
            {groupedPrices.length > 0 ? (
              groupedPrices.map(([price, count], index) => (
                <CalculationRow
                  key={price}
                  operator={index > 0 ? "+" : undefined}
                  value={`${formatPeso(price)}${count > 1 ? ` × ${count}` : ""}`}
                  label={`${count} paid item${count !== 1 ? "s" : ""}`}
                />
              ))
            ) : (
              <CalculationRow value={formatPeso(0)} label="no paid items" />
            )}
          </CalculationTooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "container_sales_commission",
    header: ({ column }) => (
      <SortableHeader
        label="Sales Comm."
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const { total_item_sales, container_sales_commission } = row.original;
      const rate =
        total_item_sales < 700_000
          ? 25
          : total_item_sales <= 799_999
            ? 20
            : 15;
      return (
        <div className="flex justify-center">
          <CalculationTooltip
            className="text-orange-500"
            result={container_sales_commission}
            resultLabel="sales commission"
          >
            <CalculationRow
              value={formatPeso(total_item_sales)}
              label="total item sales"
            />
            <CalculationRow
              operator="×"
              value={`${rate}%`}
              label="commission rate"
            />
          </CalculationTooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "atc_group_commission",
    header: ({ column }) => (
      <SortableHeader
        label="Group Comm."
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const { container_sales_commission, atc_group_commission } = row.original;
      return (
        <div className="flex justify-center">
          <CalculationTooltip
            className="text-orange-500"
            result={atc_group_commission}
            resultLabel="group commission"
          >
            <CalculationRow
              value={formatPeso(container_sales_commission)}
              label="sales commission"
            />
            <CalculationRow operator="÷" value="3" label="group divisor" />
          </CalculationTooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "preparation_fee",
    header: ({ column }) => (
      <SortableHeader
        label="Prep. Fee"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const { total_item_sales, preparation_fee } = row.original;
      return (
        <div className="flex justify-center">
          <CalculationTooltip
            className="text-orange-500"
            result={preparation_fee}
            resultLabel="preparation fee"
          >
            <CalculationRow
              value={formatPeso(total_item_sales)}
              label="total item sales"
            />
            <CalculationRow
              operator="×"
              value="5%"
              label="preparation fee rate"
            />
          </CalculationTooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "royalty",
    header: ({ column }) => (
      <SortableHeader
        label="Royalty"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const { total_item_sales, royalty } = row.original;
      const tier =
        total_item_sales < 450_000
          ? "< ₱450,000"
          : total_item_sales < 500_000
            ? "₱450,000–₱499,999"
            : total_item_sales < 550_000
              ? "₱500,000–₱549,999"
              : total_item_sales < 700_000
                ? "₱550,000–₱699,999"
                : total_item_sales < 800_000
                  ? "₱700,000–₱799,999"
                  : "≥ ₱800,000";
      return (
        <div className="flex justify-center">
          <CalculationTooltip
            className="text-orange-500"
            result={royalty}
            resultLabel="royalty"
          >
            <CalculationRow
              value={formatPeso(total_item_sales)}
              label="total item sales"
            />
            <CalculationRow
              operator="→"
              value={tier}
              label="applicable royalty tier"
            />
          </CalculationTooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "atc_sales",
    header: ({ column }) => (
      <SortableHeader
        label="ATC Sales"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const val = row.original.atc_sales;
      const {
        container_sales_commission,
        atc_group_commission,
        preparation_fee,
        royalty,
      } = row.original;
      return (
        <div className="flex justify-center">
          <CalculationTooltip
            className={val >= 0 ? "text-green-600" : "text-red-600"}
            result={val}
            resultLabel="ATC sales"
            side="left"
          >
            <CalculationRow
              value={formatPeso(container_sales_commission)}
              label="sales commission"
            />
            <CalculationRow
              operator="−"
              value={formatPeso(atc_group_commission)}
              label="group commission"
            />
            <CalculationRow
              operator="+"
              value={formatPeso(preparation_fee)}
              label="prep fee"
            />
            <CalculationRow
              operator="−"
              value={formatPeso(royalty)}
              label="royalty"
            />
          </CalculationTooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "branch.name",
    header: ({ column }) => (
      <SortableHeader
        label="Branch"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <BranchBadge branch={row.original.branch.name} />
      </div>
    ),
  },
  {
    accessorKey: "arrival_date",
    header: ({ column }) => (
      <SortableHeader
        label="Arrival"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.arrival_date
          ? formatDate(row.original.arrival_date, "MMM dd, yyyy")
          : "N/A"}
      </div>
    ),
  },
  {
    accessorKey: "due_date",
    header: ({ column }) => (
      <SortableHeader
        label="Due Date"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.due_date
          ? formatDate(row.original.due_date, "MMM dd, yyyy")
          : "N/A"}
      </div>
    ),
  },
];
