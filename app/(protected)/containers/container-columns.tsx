"use client";

import { redirect } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { parse } from "date-fns";
import { ContainerRowType } from "./container-table";

export const columns: ColumnDef<ContainerRowType>[] = [
  {
    id: "barcode",
    accessorKey: "barcode",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Barcode
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div
          className="flex justify-center hover:underline hover:cursor-pointer"
          onClick={() => redirect(`/containers/${container.barcode}`)}
        >
          {container.barcode}
        </div>
      );
    },
  },
  {
    accessorKey: "inventories.length",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Items
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">
          {container.inventory_count} items
        </div>
      );
    },
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Supplier
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">{container.supplier.name}</div>
      );
    },
  },
  {
    accessorKey: "branch.name",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Branch
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant={container.branch.name === "TARLAC" ? "success" : "warning"}
          >
            {container.branch.name}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "due_date",
    sortingFn: (rowA, rowB) => {
      const parse_date = (val: string | undefined) =>
        val ? parse(val, "MMM dd, yyyy", new Date()).getTime() : 0;
      return parse_date(rowA.original.due_date) - parse_date(rowB.original.due_date);
    },
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return <div className="flex justify-center">{container.due_date}</div>;
    },
  },
];
