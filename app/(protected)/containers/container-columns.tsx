"use client";

import { redirect } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
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
          {container.inventories.length} items
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
