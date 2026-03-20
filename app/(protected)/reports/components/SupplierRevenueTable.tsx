"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { SupplierRevenueSummaryEntry } from "src/entities/models/Report";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, Info } from "lucide-react";
import { formatNumberToCurrency } from "@/app/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

const columns: ColumnDef<SupplierRevenueSummaryEntry>[] = [
  {
    accessorKey: "supplier_name",
    header: ({ column }) => (
      <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Supplier <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.original.supplier_name}</div>,
  },
  {
    accessorKey: "supplier_code",
    header: () => <div className="text-center">Code</div>,
    cell: ({ row }) => <div className="flex justify-center text-muted-foreground">{row.original.supplier_code}</div>,
  },
  {
    accessorKey: "container_count",
    header: () => <div className="text-center">Containers</div>,
    cell: ({ row }) => <div className="flex justify-center">{row.original.container_count}</div>,
  },
  {
    accessorKey: "items_sold",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Items Sold <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => <div className="flex justify-center text-green-500">{row.original.items_sold}</div>,
  },
  {
    accessorKey: "total_revenue",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Total Revenue <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-green-500 font-semibold">
        {formatNumberToCurrency(row.original.total_revenue)}
      </div>
    ),
  },
  {
    accessorKey: "atc_com",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          ATC COM <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-yellow-500 font-semibold">
        {row.original.atc_com > 0 ? formatNumberToCurrency(row.original.atc_com) : "—"}
      </div>
    ),
  },
  {
    accessorKey: "atc_group_com",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button variant="ghost" className="cursor-pointer" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          ATC Group 5% COM <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-orange-500 font-semibold">
        {row.original.atc_group_com > 0 ? formatNumberToCurrency(row.original.atc_group_com) : "—"}
      </div>
    ),
  },
];

interface Props {
  data: SupplierRevenueSummaryEntry[];
}

export const SupplierRevenueTable = ({ data }: Props) => {
  const totalRevenue = data.reduce((sum, d) => sum + d.total_revenue, 0);
  const totalAtcCom = data.reduce((sum, d) => sum + d.atc_com, 0);
  const totalAtcGroupCom = data.reduce((sum, d) => sum + d.atc_group_com, 0);
  const totalItemsSold = data.reduce((sum, d) => sum + d.items_sold, 0);

  return (
    <DataTable
      title={
        <div className="flex items-center gap-6">
          <span>Items Sold: <span className="text-green-500 font-semibold">{totalItemsSold}</span></span>
          <span>Total Revenue: <span className="text-green-500 font-semibold">{formatNumberToCurrency(totalRevenue)}</span></span>
          <span>ATC COM: <span className="text-yellow-500 font-semibold">{formatNumberToCurrency(totalAtcCom)}</span></span>
          <span>ATC Group 5% COM: <span className="text-orange-500 font-semibold">{formatNumberToCurrency(totalAtcGroupCom)}</span></span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="text-muted-foreground h-4 w-4 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-72 space-y-2 text-xs leading-relaxed">
              <p className="font-semibold">Commission Computation</p>
              <div>
                <p className="text-muted-foreground mb-1">ATC COM is tiered by total revenue:</p>
                <ul className="space-y-0.5">
                  <li>• &lt; ₱700,000 → <span className="font-semibold">25%</span></li>
                  <li>• ₱700,000 – ₱799,999 → <span className="font-semibold">20%</span></li>
                  <li>• ≥ ₱800,000 → <span className="font-semibold">15%</span></li>
                </ul>
              </div>
              <p>ATC Group 5% COM = ATC COM ÷ 3</p>
              <div className="border-t pt-2">
                <p className="font-semibold mb-1">Example (₱500,000 revenue):</p>
                <p>ATC COM = ₱500,000 × 25% = <span className="font-semibold">₱125,000</span></p>
                <p>ATC Group 5% COM = ₱125,000 ÷ 3 = <span className="font-semibold">₱41,667</span></p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      }
      columns={columns}
      data={data}
    />
  );
};
