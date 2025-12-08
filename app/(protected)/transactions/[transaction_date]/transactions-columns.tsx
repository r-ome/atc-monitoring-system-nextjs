"use client";

import { useRouter } from "next/navigation";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Payment } from "src/entities/models/Payment";
import { Badge } from "@/app/components/ui/badge";
import { cn, formatDate } from "@/app/lib/utils";

const ReceiptNumberCell = ({ row }: { row: Row<Payment> }) => {
  const payment = row.original;
  const router = useRouter();
  return (
    <div
      className="flex justify-center cursor-pointer hover:underline"
      onClick={() => {
        router.push(
          `/auctions/${payment.auction_date}/payments/${payment.receipt.receipt_number}`
        );
      }}
    >
      {payment.receipt.receipt_number}
    </div>
  );
};

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "receipt.purpose",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Purpose
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant={
              ["PULL_OUT", "REGISTRATION"].includes(payment.receipt.purpose)
                ? "success"
                : "destructive"
            }
          >
            {payment.receipt.purpose.replace(/_/g, " ")}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "bidder.bidder_number",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bidder #
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="flex justify-center">
          {payment.bidder.bidder_number}
        </div>
      );
    },
  },
  {
    accessorKey: "amount_paid",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount Paid
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment = row.original;
      const amountPaid = payment.amount_paid.toLocaleString();
      return (
        <div
          className={cn(
            "flex justify-center",
            payment.receipt.purpose === "REFUNDED" ? "text-red-500" : ""
          )}
        >
          {payment.receipt.purpose === "REFUNDED"
            ? `(${amountPaid})`
            : amountPaid}
          {}
        </div>
      );
    },
  },
  {
    accessorKey: "receipt",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Receipt
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => <ReceiptNumberCell row={row} />,
  },
  {
    id: "payment_method.name",
    accessorFn: (row) => row.payment_method.name,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payment Method
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <div className="flex justify-center">{payment.payment_method.name}</div>
      );
    },
  },
  {
    accessorKey: "created_at",
    sortingFn: (rowA, rowB, columnId) => {
      const a = new Date(rowA.getValue<string>(columnId)).getTime();
      const b = new Date(rowB.getValue<string>(columnId)).getTime();
      return a - b;
    },
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Time
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment = row.original;
      const created_at = new Date(payment.created_at);
      return (
        <div className="flex justify-center">
          {formatDate(created_at, "hh:mm a")}
        </div>
      );
    },
  },
];
