"use client";

import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Payment } from "src/entities/models/Payment";
import { format } from "date-fns";

export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "purpose",
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
          {payment.receipt.purpose.replace(/_/g, " ")}
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
      return (
        <div className="flex justify-center">
          {payment.amount_paid.toLocaleString()}
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
    cell: ({ row }) => {
      const payment = row.original;
      const router = useRouter();
      return (
        <div
          className="flex justify-center cursor-pointer hover:underline"
          onClick={() => {
            const auction_date = format(payment.created_at, "yyyy-MM-dd");
            router.push(
              `/auctions/${auction_date}/payments/${payment.receipt.receipt_number}`
            );
          }}
        >
          {payment.receipt.receipt_number}
        </div>
      );
    },
  },
  {
    id: "payment_type",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payment Type
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment = row.original;
      return <div className="flex justify-center">{payment.payment_type}</div>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date & Time
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment = row.original;
      return <div className="flex justify-center">{payment.created_at}</div>;
    },
  },
];
