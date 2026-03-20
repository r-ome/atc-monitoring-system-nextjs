"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { PaymentMethodBreakdown } from "src/entities/models/Report";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

const columns: ColumnDef<PaymentMethodBreakdown>[] = [
  {
    accessorKey: "payment_method_name",
    header: "Payment Method",
    cell: ({ row }) => (
      <div className="font-medium">{row.original.payment_method_name}</div>
    ),
  },
  {
    accessorKey: "transaction_count",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Transactions
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.transaction_count}</div>
    ),
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Amount
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        {formatNumberToCurrency(row.original.total_amount)}
      </div>
    ),
  },
];

interface Props {
  data: PaymentMethodBreakdown[];
}

export const PaymentMethodBreakdownTable = ({ data }: Props) => {
  const total = data.reduce((sum, d) => sum + d.total_amount, 0);
  const totalTransactions = data.reduce((sum, d) => sum + d.transaction_count, 0);

  return (
    <DataTable
      title={
        <div className="flex gap-6">
          <span>
            Total: <span className="text-green-500">{formatNumberToCurrency(total)}</span>
          </span>
          <span>
            Transactions: <span className="font-semibold">{totalTransactions}</span>
          </span>
        </div>
      }
      columns={columns}
      data={data}
    />
  );
};
