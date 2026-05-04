"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { ContainerStatusEntry } from "src/entities/models/Report";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, InfoIcon } from "lucide-react";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { parse } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

const parseReportDate = (value: string | null) =>
  value ? parse(value, "MMM dd, yyyy", new Date()).getTime() : 0;

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

const columns: ColumnDef<ContainerStatusEntry>[] = [
  {
    accessorKey: "barcode",
    size: 30,
    header: () => <div>Barcode</div>,
    cell: ({ row }) => {
      const {
        barcode, supplier_name, container_number,
        total_items, paid_items,
        arrival_date, due_date, days_since_arrival, status,
      } = row.original;
      const aging = status === "PAID" ? 0 : days_since_arrival;
      const agingColor =
        aging === null ? "text-muted-foreground"
        : aging === 0   ? "text-green-500"
        : aging > 60    ? "text-red-500"
        : aging > 30    ? "text-yellow-500"
                        : "text-muted-foreground";
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="font-mono text-sm cursor-help underline decoration-dotted w-fit">
              {barcode}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs space-y-0.5">
            <p className="font-medium">{supplier_name}</p>
            <p className="text-white">Container #: {container_number ?? "—"}</p>
            <p className="text-white">Items: {total_items} &nbsp;·&nbsp; Paid: {paid_items}</p>
            <p className="text-white">Arrival: {arrival_date ?? "—"}</p>
            <p className="text-white">Due: {due_date ?? "—"}</p>
            <p>
              Aging:{" "}
              <span className={`font-semibold ${agingColor}`}>
                {aging === null ? "—" : `${aging}d`}
              </span>
            </p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <SortableHeader
        label="Status"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      />
    ),
    cell: ({ row }) => {
      const isPaid = row.original.status === "PAID";
      return (
        <div
          className={`flex justify-center font-semibold ${isPaid ? "text-green-500" : "text-red-500"}`}
        >
          {row.original.status}
        </div>
      );
    },
  },
  {
    accessorKey: "duties_and_taxes",
    header: () => <div className="text-center">Duties & Taxes</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        {row.original.duties_and_taxes > 0
          ? formatNumberToCurrency(row.original.duties_and_taxes)
          : "—"}
      </div>
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
    cell: ({ row }) => (
      <div className="flex justify-center text-green-500 font-semibold">
        {row.original.total_item_sales > 0
          ? formatNumberToCurrency(row.original.total_item_sales)
          : "—"}
      </div>
    ),
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
      const { atc_sales, container_sales_commission, atc_group_commission, preparation_fee, royalty } = row.original;
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`flex justify-center font-semibold cursor-help underline decoration-dotted ${atc_sales >= 0 ? "text-green-500" : "text-red-500"}`}
            >
              {formatNumberToCurrency(atc_sales)}
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs space-y-0.5">
            <p className="text-white">Sales Comm. &nbsp;{formatNumberToCurrency(container_sales_commission)}</p>
            <p className="text-white">− Group Comm. &nbsp;{formatNumberToCurrency(atc_group_commission)}</p>
            <p className="text-white">+ Prep. Fee &nbsp;{formatNumberToCurrency(preparation_fee)}</p>
            <p className="text-white">− Royalty &nbsp;{formatNumberToCurrency(royalty)}</p>
            <p className="border-t border-white/30 pt-0.5 font-semibold text-white">
              = {formatNumberToCurrency(atc_sales)}
            </p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
];

interface Props {
  data: ContainerStatusEntry[];
}

export const ContainerStatusTable = ({ data }: Props) => {
  const total = data.length;
  const paid = data.filter((d) => d.status === "PAID").length;
  const unpaid = data.filter((d) => d.status === "UNPAID").length;
  const totalItemSales = data.reduce((s, d) => s + d.total_item_sales, 0);
  const totalCommission = data.reduce((s, d) => s + d.container_sales_commission, 0);
  const totalGroupCommission = data.reduce((s, d) => s + d.atc_group_commission, 0);
  const totalPrepFee = data.reduce((s, d) => s + d.preparation_fee, 0);
  const totalRoyalty = data.reduce((s, d) => s + d.royalty, 0);
  const totalAtcSales = data.reduce((s, d) => s + d.atc_sales, 0);

  return (
    <DataTable
      title={
        <div className="grid grid-cols-[auto_auto] w-fit gap-x-6 gap-y-0.5 text-sm mb-2">
          <span className="text-muted-foreground">Containers</span>
          <span className="font-semibold tabular-nums">{total}</span>

          <span className="text-muted-foreground">Paid</span>
          <span className="text-green-500 font-semibold tabular-nums">{paid}</span>

          <span className="text-muted-foreground">Unpaid</span>
          <span className="text-red-500 font-semibold tabular-nums">{unpaid}</span>

          <LabelWithHint
            label="Item Sales"
            hint="Sum of all PAID auction item prices per container."
          />
          <span className="text-green-500 font-semibold tabular-nums">{formatNumberToCurrency(totalItemSales)}</span>

          <LabelWithHint
            label="Sales Comm."
            hint={`Tiered rate applied to each container's total sales:\n< ₱700,000 → 25%\n₱700,000–₱799,999 → 20%\n≥ ₱800,000 → 15%`}
          />
          <span className="text-orange-500 font-semibold tabular-nums">{formatNumberToCurrency(totalCommission)}</span>

          <LabelWithHint
            label="Group Comm."
            hint="Container Sales Commission ÷ 3"
          />
          <span className="text-orange-500 font-semibold tabular-nums">{formatNumberToCurrency(totalGroupCommission)}</span>

          <LabelWithHint
            label="Prep. Fee"
            hint="5% of Total Item Sales per container."
          />
          <span className="text-orange-500 font-semibold tabular-nums">{formatNumberToCurrency(totalPrepFee)}</span>

          <LabelWithHint
            label="Royalty"
            hint={`Flat fee per container based on its sales:\n< ₱450,000 → ₱20,000\n₱450,000–₱499,999 → ₱22,000\n₱500,000–₱549,999 → ₱25,000\n₱550,000–₱699,999 → ₱30,000\n₱700,000–₱799,999 → ₱32,000\n≥ ₱800,000 → ₱35,000`}
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
      data={data}
      initialSorting={[{ id: "due_date", desc: false }]}
    />
  );
};
