"use client";

import { useState } from "react";
import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SupplierRevenueSummaryEntry } from "src/entities/models/Report";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, InfoIcon } from "lucide-react";
import { formatNumberToCurrency } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { FilterColumnComponent } from "@/app/components/data-table/FilterColumnComponent";

function LabelWithHint({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <InfoIcon className="size-3 cursor-help shrink-0 text-muted-foreground/60" />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-56 whitespace-pre-line text-xs">
          {hint}
        </TooltipContent>
      </Tooltip>
    </span>
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

const columns: ColumnDef<SupplierRevenueSummaryEntry>[] = [
  {
    accessorKey: "supplier_name",
    size: 220,
    header: ({ column }) => (
      <SortableHeader
        label="Supplier"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const { supplier_code, supplier_name, container_count } = row.original;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="font-medium overflow-hidden cursor-default">
              <p className="truncate">
                <span className="text-muted-foreground mr-1">
                  ({supplier_code})
                </span>
                {supplier_name}
              </p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{supplier_name}</p>
            <p className="text-muted-foreground">
              {container_count} container{container_count !== 1 ? "s" : ""}
            </p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "sales_remittance_account",
    size: 160,
    header: () => <div className="text-center">Remittance Acct.</div>,
    cell: ({ row }) => {
      const acct = row.original.sales_remittance_account;
      if (!acct) {
        return (
          <div className="flex justify-center text-muted-foreground text-sm">
            —
          </div>
        );
      }
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex justify-center overflow-hidden cursor-default">
              <p className="truncate text-muted-foreground text-sm">{acct}</p>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {acct}
          </TooltipContent>
        </Tooltip>
      );
    },
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
      const { total_item_sales, items_sold } = row.original;
      return (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help text-green-500 font-semibold underline decoration-dotted">
                {formatNumberToCurrency(total_item_sales)}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              Items sold: {items_sold}
            </TooltipContent>
          </Tooltip>
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
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500 font-semibold">
        {row.original.container_sales_commission > 0
          ? formatNumberToCurrency(row.original.container_sales_commission)
          : "—"}
      </div>
    ),
  },
  {
    accessorKey: "atc_group_commission",
    header: ({ column }) => (
      <SortableHeader
        label="Group Comm."
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500 font-semibold">
        {row.original.atc_group_commission > 0
          ? formatNumberToCurrency(row.original.atc_group_commission)
          : "—"}
      </div>
    ),
  },
  {
    accessorKey: "preparation_fee",
    header: ({ column }) => (
      <SortableHeader
        label="Prep. Fee"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500 font-semibold">
        {row.original.preparation_fee > 0
          ? formatNumberToCurrency(row.original.preparation_fee)
          : "—"}
      </div>
    ),
  },
  {
    accessorKey: "royalty",
    header: ({ column }) => (
      <SortableHeader
        label="Royalty"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500 font-semibold">
        {row.original.royalty > 0
          ? formatNumberToCurrency(row.original.royalty)
          : "—"}
      </div>
    ),
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
      return (
        <div
          className={`flex justify-center font-semibold ${val >= 0 ? "text-green-500" : "text-red-500"}`}
        >
          {formatNumberToCurrency(val)}
        </div>
      );
    },
  },
];

const ACCOUNT_FILTER_OPTIONS = [
  { value: "ATC", label: "ATC" },
  { value: "ECORE", label: "ECORE" },
];

interface Props {
  data: SupplierRevenueSummaryEntry[];
}

export const SupplierRevenueTable = ({ data }: Props) => {
  const [accountFilter, setAccountFilter] = useState<string[]>([]);

  const filteredData =
    accountFilter.length === 0
      ? data
      : data.filter((row) => {
          const acct = (row.sales_remittance_account ?? "").toUpperCase();
          return accountFilter.some((f) => acct.includes(f.toUpperCase()));
        });

  const totalItemSales = filteredData.reduce((s, d) => s + d.total_item_sales, 0);
  const totalCommission = filteredData.reduce((s, d) => s + d.container_sales_commission, 0);
  const totalGroupCommission = filteredData.reduce((s, d) => s + d.atc_group_commission, 0);
  const totalPrepFee = filteredData.reduce((s, d) => s + d.preparation_fee, 0);
  const totalRoyalty = filteredData.reduce((s, d) => s + d.royalty, 0);
  const totalAtcSales = filteredData.reduce((s, d) => s + d.atc_sales, 0);

  return (
    <DataTable
      title={
        <div className="grid grid-cols-[auto_auto] w-fit gap-x-6 gap-y-0.5 text-sm mb-2">
          <LabelWithHint
            label="Item Sales"
            hint="Sum of all PAID auction item prices across the displayed suppliers."
          />
          <span className="text-green-500 font-semibold tabular-nums">{formatNumberToCurrency(totalItemSales)}</span>

          <LabelWithHint
            label="Sales Comm."
            hint={`Tiered rate applied to each supplier's total sales:\n< ₱700,000 → 25%\n₱700,000–₱799,999 → 20%\n≥ ₱800,000 → 15%`}
          />
          <span className="text-orange-500 font-semibold tabular-nums">{formatNumberToCurrency(totalCommission)}</span>

          <LabelWithHint
            label="Group Comm."
            hint="Container Sales Commission ÷ 3"
          />
          <span className="text-orange-500 font-semibold tabular-nums">{formatNumberToCurrency(totalGroupCommission)}</span>

          <LabelWithHint
            label="Prep. Fee"
            hint="5% of Total Item Sales per supplier."
          />
          <span className="text-orange-500 font-semibold tabular-nums">{formatNumberToCurrency(totalPrepFee)}</span>

          <LabelWithHint
            label="Royalty"
            hint={`Sum of per-container flat fees based on each container's sales:\n< ₱450,000 → ₱20,000\n₱450,000–₱499,999 → ₱22,000\n₱500,000–₱549,999 → ₱25,000\n₱550,000–₱699,999 → ₱30,000\n₱700,000–₱799,999 → ₱32,000\n≥ ₱800,000 → ₱35,000`}
          />
          <span className="text-orange-500 font-semibold tabular-nums">{formatNumberToCurrency(totalRoyalty)}</span>

          <LabelWithHint
            label="ATC Sales"
            hint="(Sales Comm. − Group Comm. + Prep. Fee) − Royalty"
          />
          <span className={`font-semibold tabular-nums ${totalAtcSales >= 0 ? "text-green-500" : "text-red-500"}`}>{formatNumberToCurrency(totalAtcSales)}</span>
        </div>
      }
      columns={columns}
      data={filteredData}
      actionButtons={
        <FilterColumnComponent
          options={ACCOUNT_FILTER_OPTIONS}
          onChangeEvent={setAccountFilter}
          placeholder="Filter by Account"
        />
      }
    />
  );
};
