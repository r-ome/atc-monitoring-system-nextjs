"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Expense } from "src/entities/models/Expense";
import { Badge } from "@/app/components/ui/badge";

export const payrollColumns: ColumnDef<Expense>[] = [
  {
    id: "employee",
    accessorFn: (row) => row.employee?.full_name ?? "—",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Employee
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => row.original.employee?.full_name ?? <span className="text-muted-foreground">—</span>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
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
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-error">
        ({row.original.amount.toLocaleString()})
      </div>
    ),
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }) => row.original.remarks,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
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
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.created_at}</div>
    ),
  },
];
