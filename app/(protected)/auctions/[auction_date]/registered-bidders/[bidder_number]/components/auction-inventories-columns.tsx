"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { RegisteredBidder } from "src/entities/models/Bidder";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { cn, formatDate } from "@/app/lib/utils";
import { Checkbox } from "@/app/components/ui/checkbox";
import { redirect } from "next/navigation";

export type AuctionInventory = RegisteredBidder["auction_inventories"][number];

export const columns: ColumnDef<AuctionInventory>[] = [
  {
    accessorKey: "select",
    size: 30,
    enableHiding: false,
    header: ({ table }) => {
      return (
        <div className="flex justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        </div>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="flex justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
            }}
            aria-label="Select row"
          />
        </div>
      );
    },
  },
  {
    accessorKey: "auction_status",
    accessorFn: (row) => row.status,
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
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
    cell: ({ getValue }) => {
      const status = getValue<string>();
      const variant =
        status === "PARTIAL"
          ? "warning"
          : ["CANCELLED", "UNPAID", "REFUNDED"].includes(status)
          ? "destructive"
          : "success";

      return (
        <div className="flex justify-center">
          <Badge variant={variant}>{status}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "barcode",
    accessorFn: (row) => row.inventory.barcode,
    size: 100,
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
      const item = row.original;
      return (
        <div
          className="flex justify-center hover:underline hover:cursor-pointer"
          onClick={() =>
            redirect(
              `/auctions/${formatDate(
                new Date(item.created_at),
                "yyyy-MM-dd"
              )}/monitoring/${item.auction_inventory_id}`
            )
          }
        >
          {item.inventory.barcode}
        </div>
      );
    },
  },
  {
    accessorKey: "control",
    accessorFn: (row) => row.inventory.control,
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Control
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ getValue }) => {
      return <div className="flex justify-center">{getValue<string>()}</div>;
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
      const auctionInventory = row.original;
      return (
        <div className="flex justify-center">
          {auctionInventory.description}
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
      const auctionInventory = row.original;
      return <div className="flex justify-center">{auctionInventory.qty}</div>;
    },
  },
  {
    accessorKey: "price",
    size: 100,
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
      const auctionInventory = row.original;
      return (
        <div className={cn("flex justify-center")}>
          {auctionInventory.price.toLocaleString()}
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
      const auctionInventory = row.original;
      return (
        <div className="flex justify-center">
          {auctionInventory.manifest_number}
        </div>
      );
    },
  },
  // {
  //   id: "actions",
  //   enableHiding: false,
  //   size: 50,
  //   cell: ({ row }) => {
  //     const registeredBidder = row.original;
  //     return (
  //       <DropdownMenu>
  //         <DropdownMenuTrigger asChild className="cursor-pointer">
  //           <Button variant="ghost" className="h-8 w-8 p-0">
  //             <span className="sr-only">Open menu</span>
  //             <MoreHorizontal />
  //           </Button>
  //         </DropdownMenuTrigger>
  //         <DropdownMenuContent align="end">
  //           <DropdownMenuLabel>Actions</DropdownMenuLabel>
  //           <DropdownMenuSeparator />
  //           <DropdownMenuItem
  //             onClick={() =>
  //               redirect(
  //                 `registered-bidders/${registeredBidder.auction_bidder_id}`
  //               )
  //             }
  //           >
  //             View Bidder
  //           </DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
];
