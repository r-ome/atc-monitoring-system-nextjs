"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { SalesRowType } from "./SalesTable";
import { formatNumberToCurrency } from "@/app/lib/utils";

export const columns: ColumnDef<SalesRowType>[] = [
  {
    accessorKey: "period",
    size: 100,
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Period
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.period}</div>
    ),
  },
  {
    accessorKey: "sales_commission",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Sales Comm.
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-success">
        {formatNumberToCurrency(row.original.sales_commission)}
      </div>
    ),
  },
  {
    accessorKey: "service_charge",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Service Charge
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-success">
        {formatNumberToCurrency(row.original.service_charge)}
      </div>
    ),
  },
  {
    accessorKey: "sorting_preparation_fee",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Prep. Fee
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-success">
        {formatNumberToCurrency(row.original.sorting_preparation_fee)}
      </div>
    ),
  },
  {
    accessorKey: "total_income",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Income
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-success">
        {formatNumberToCurrency(row.original.total_income)}
      </div>
    ),
  },
  {
    accessorKey: "expenses",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Expenses
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-error">
        {formatNumberToCurrency(row.original.expenses)}
      </div>
    ),
  },
  {
    accessorKey: "atc_group_commission",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Group Comm.
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-error">
        {formatNumberToCurrency(row.original.atc_group_commission)}
      </div>
    ),
  },
  {
    accessorKey: "royalty",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Royalty
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-error">
        {formatNumberToCurrency(row.original.royalty)}
      </div>
    ),
  },
  {
    accessorKey: "total_expenses",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Total Expenses
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center text-status-error">
        {formatNumberToCurrency(row.original.total_expenses)}
      </div>
    ),
  },
  {
    accessorKey: "net_income",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Net Income
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div
        className={
          row.original.net_income >= 0
            ? "flex justify-center text-status-success"
            : "flex justify-center text-status-error"
        }
      >
        {formatNumberToCurrency(row.original.net_income)}
      </div>
    ),
  },
];
