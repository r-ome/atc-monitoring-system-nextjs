"use client";

import { redirect } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import type { RegisteredBidder } from "src/entities/models/Bidder";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/app/lib/utils";

export const columns: ColumnDef<RegisteredBidder>[] = [
  {
    accessorKey: "bidder.bidder_number",
    header: ({ column }) => {
      return (
        <div className="flex justify-start">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bidder Number
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const registeredBidder = row.original;
      const name =
        registeredBidder.bidder.bidder_number === "5013"
          ? "CANCELLED ITEMS"
          : `${registeredBidder.bidder.bidder_number} - ${registeredBidder.bidder.full_name}`;
      return (
        <div
          className="flex justify-start hover:underline hover:cursor-pointer"
          onClick={() => {
            redirect(
              `registered-bidders/${registeredBidder.bidder.bidder_number}`
            );
          }}
        >
          {name}
        </div>
      );
    },
  },
  {
    accessorKey: "registration_fee",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Registration Fee
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const registeredBidder = row.original;
      return (
        <div className="flex justify-center">
          {registeredBidder.registration_fee.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "service_charge",
    size: 100,
    header: ({ column }) => {
      return (
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
      );
    },
    cell: ({ row }) => {
      const registeredBidder = row.original;
      return (
        <div className="flex justify-center">
          {registeredBidder.service_charge.toLocaleString()}%
        </div>
      );
    },
  },
  {
    accessorKey: "auction_inventories",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            No. of Items
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const registeredBidder = row.original;
      return (
        <div className="flex justify-center">
          {registeredBidder.auction_inventories.length} items
        </div>
      );
    },
  },
  {
    accessorKey: "balance",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Balance
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const registeredBidder = row.original;
      return (
        <div
          className={cn(
            "flex justify-center",
            registeredBidder.balance > 0 && "text-red-500",
            registeredBidder.balance < 0 && "text-green-500"
          )}
        >
          {registeredBidder.balance.toLocaleString()}
        </div>
      );
    },
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
            Time Registered
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const registeredBidder = row.original;
      return (
        <div className="flex justify-center">{registeredBidder.created_at}</div>
      );
    },
  },
];
