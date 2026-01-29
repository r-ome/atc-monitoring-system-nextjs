"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Expense } from "src/entities/models/Expense";
import { Badge } from "@/app/components/ui/badge";
import { cn, formatDate } from "@/app/lib/utils";

export const columns: ColumnDef<Expense>[] = [
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
      const expense = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant={
              expense.purpose === "ADD_PETTY_CASH" ? "success" : "destructive"
            }
          >
            {expense.purpose.replace(/_/g, " ")}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Amount
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const expense = row.original;
      const amount = expense.amount.toLocaleString();
      return (
        <div
          className={cn(
            "flex justify-center",
            expense.purpose === "EXPENSE" ? "text-red-500" : "text-green-500"
          )}
        >
          {expense.purpose === "EXPENSE" ? `(${amount})` : amount}
        </div>
      );
    },
  },
  {
    accessorKey: "remarks",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Remarks
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.remarks}</div>
    ),
  },
  {
    accessorKey: "created_at",
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
