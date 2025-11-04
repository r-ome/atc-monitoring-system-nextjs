"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/app/lib/utils";

import { CounterCheck } from "src/entities/models/CounterCheck";
import { SetStateAction } from "react";

export const columns = (
  setOpen: React.Dispatch<SetStateAction<boolean>>,
  setSelected: React.Dispatch<SetStateAction<CounterCheck | undefined>>
): ColumnDef<CounterCheck>[] => [
  {
    accessorKey: "control",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Control #
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const counter_check = row.original;
      return <div className="flex justify-center">{counter_check.control}</div>;
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Price
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const counter_check = row.original;
      return (
        <div
          className={cn(
            "flex justify-center",
            counter_check.price ? "" : "bg-red-500"
          )}
        >
          {counter_check.price
            ? parseInt(counter_check.price).toLocaleString()
            : "NO PRICE"}
        </div>
      );
    },
  },
  {
    accessorKey: "bidder_number",
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
      const counter_check = row.original;
      return (
        <div
          className={cn(
            "flex justify-center",
            counter_check.bidder_number === "0000" ? "bg-red-500" : ""
          )}
        >
          {counter_check.bidder_number === "0000"
            ? "NO BIDDER"
            : counter_check.bidder_number}
        </div>
      );
    },
  },
  {
    accessorKey: "page",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Page
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const counter_check = row.original;
      return <div className="flex justify-center">{counter_check.page}</div>;
    },
  },
  {
    id: "actions",
    size: 50,
    cell: ({ row }) => {
      const counter_check = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="cursor-pointer">
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                setOpen(true);
                setSelected(counter_check);
              }}
            >
              Update Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
