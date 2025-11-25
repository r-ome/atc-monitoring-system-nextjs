"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { AuctionTransaction } from "src/entities/models/Payment";
import { redirect } from "next/navigation";

export const columns: ColumnDef<AuctionTransaction>[] = [
  {
    accessorKey: "created_at",
    size: 200,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
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
    sortingFn: (rowA, rowB, columnId) => {
      const a = new Date(rowA.getValue<string>(columnId)).getTime();
      const b = new Date(rowB.getValue<string>(columnId)).getTime();
      return a - b;
    },
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <div className="flex justify-center"> {transaction.created_at}</div>
      );
    },
  },
  {
    accessorKey: "total_amount_paid",
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
      const receipt = row.original;
      return (
        <div className="flex justify-center">
          ₱ {receipt.total_amount_paid.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "receipt_number",
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
      const receipt = row.original;
      return (
        <div
          className="flex justify-center hover:cursor-pointer hover:underline"
          onClick={() => redirect(`payments/${receipt.receipt_number}`)}
        >
          {receipt.receipt_number}
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
            Bidder
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const receipt = row.original;
      return (
        <div className="flex justify-center">
          {receipt.bidder.bidder_number}
        </div>
      );
    },
  },
  {
    accessorKey: "purpose",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Purpose
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const receipt = row.original;
      return (
        <div className="flex justify-center">
          {receipt.purpose.replace(/_/g, " ")}
        </div>
      );
    },
  },
];
