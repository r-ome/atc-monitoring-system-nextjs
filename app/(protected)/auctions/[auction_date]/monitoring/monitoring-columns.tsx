"use client";

import { redirect } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { AuctionsInventory } from "src/entities/models/Auction";
import { createGroupSortingFn } from "@/app/lib/utils";
import { cn } from "@/app/lib/utils";

const controlGroupSortingFn = createGroupSortingFn<AuctionsInventory, string>(
  (row) => row.is_slash_item ?? row.auction_inventory_id,
  (row) => row.inventory.control,
  (a, b) => a.localeCompare(b)
);

export const columns = (
  slashGroupMap: Record<string, number>,
  isMasterList = false
): ColumnDef<AuctionsInventory>[] => [
  {
    accessorKey: "inventory.barcode",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Barcode
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction_inventory = row.original;
      return (
        <div
          className={cn(
            `flex justify-center`,
            !isMasterList && "hover:underline hover:cursor-pointer"
          )}
          onClick={() => {
            if (!isMasterList) {
              redirect(`monitoring/${auction_inventory.auction_inventory_id}`);
            }
          }}
        >
          {auction_inventory.inventory.barcode}
        </div>
      );
    },
  },
  {
    accessorKey: "inventory.control",
    enableResizing: true,
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Control #
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    sortingFn: controlGroupSortingFn,
    cell: ({ row }) => {
      const auction_inventory = row.original;
      const is_slash_item = auction_inventory.is_slash_item;
      const idx = is_slash_item ? slashGroupMap[is_slash_item] : undefined;

      return (
        <div className="flex justify-center">
          {auction_inventory.inventory.control}
          {idx ? `(A${idx})` : ""}
        </div>
      );
    },
  },
  {
    accessorKey: "description",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Description
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction_inventory = row.original;
      return (
        <div className="flex justify-center">
          {auction_inventory.description}
        </div>
      );
    },
  },
  {
    accessorKey: "qty",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            QTY
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction_inventory = row.original;
      return (
        <div className="flex justify-center">
          {auction_inventory.qty === "0.5" ? "1/2" : auction_inventory.qty}
        </div>
      );
    },
  },
  {
    id: "auction_bidder.bidder.bidder_number",
    accessorFn: (row) => row.bidder.bidder_number,
    size: 100,
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
      const auction_inventory = row.original;
      const bidder_number =
        auction_inventory.bidder.bidder_number === "5013"
          ? "ATC"
          : auction_inventory.bidder.bidder_number;
      return <div className="flex justify-center">{bidder_number}</div>;
    },
  },
  {
    accessorKey: "price",
    size: 80,
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
      const auction_inventory = row.original;
      return (
        <div className="flex justify-center">
          {auction_inventory.price.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    size: 80,
    enableColumnFilter: true,
    filterFn: "includesIn",
    header: ({ column }) => {
      return (
        <div className="justify-center flex">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction_inventory = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant={
              auction_inventory.status === "PAID" ? "success" : "destructive"
            }
          >
            {auction_inventory.status}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "manifest_number",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Manifest
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const auction_inventory = row.original;
      return (
        <div className="flex justify-center">
          {auction_inventory.manifest_number}
        </div>
      );
    },
  },
  ...(isMasterList
    ? [
        {
          accessorKey: "auction_date",
          header: ({ column }) => {
            return (
              <div className="justify-center flex">
                <Button
                  variant="ghost"
                  className="cursor-pointer"
                  onClick={() =>
                    column.toggleSorting(column.getIsSorted() === "asc")
                  }
                >
                  Auction Date
                  <ArrowUpDown />
                </Button>
              </div>
            );
          },
          cell: ({ row }) => {
            const auction_inventory = row.original;
            return (
              <div className="flex justify-center">
                {auction_inventory.auction_date}
              </div>
            );
          },
        } as ColumnDef<AuctionsInventory>,
      ]
    : []),
];
