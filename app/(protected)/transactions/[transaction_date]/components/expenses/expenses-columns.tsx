"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Expense } from "src/entities/models/Expense";
import { ExpenseTypeBadge } from "@/app/components/admin";
import { cn } from "@/app/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";

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
          <ExpenseTypeBadge expenseType={expense.purpose} />
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
            expense.purpose === "EXPENSE" ? "text-status-error" : "text-status-success"
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
            Date & Time
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const expense = row.original;
      const hasUpdatedAt = expense.updated_at !== expense.created_at;
      return (
        <div className="flex justify-center">
          {hasUpdatedAt ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default">
                  {expense.created_at}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                Updated: {expense.updated_at}
              </TooltipContent>
            </Tooltip>
          ) : (
            <span>{expense.created_at}</span>
          )}
        </div>
      );
    },
  },
];
