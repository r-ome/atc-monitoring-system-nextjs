"use client";

import { redirect } from "next/navigation";
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
import { Badge } from "@/app/components/ui/badge";
import { BidderRowType } from "./bidders-table";

export const columns: ColumnDef<BidderRowType>[] = [
  {
    accessorKey: "bidder_number",
    size: 100,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Bidder #
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const bidder = row.original;
      return <div className="flex justify-center">{bidder.bidder_number}</div>;
    },
  },
  {
    accessorKey: "full_name",
    enableResizing: true,
    size: 170,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown />
        </Button>
      );
    },
  },
  {
    accessorKey: "birthdate",
    size: 100,
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer flex justify-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Birth Date
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const bidder = row.original;
      return <div className="flex justify-center">{bidder.birthdate}</div>;
    },
  },
  {
    accessorKey: "service_charge",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer flex justify-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Service Charge (%)
          <ArrowUpDown />
        </Button>
      </div>
    ),
    size: 130,
    cell: ({ row }) => {
      const bidder = row.original;
      return (
        <div className="flex justify-center">{bidder.service_charge}%</div>
      );
    },
  },
  // {
  //   accessorKey: "contact_number",
  //   header: "Contact",
  //   size: 100,
  //   cell: ({ row }) => {
  //     const bidder = row.original;
  //     return <div>{bidder.contact_number}</div>;
  //   },
  // },
  {
    accessorKey: "registration_fee",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Registration Fee
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    size: 100,
    cell: ({ row }) => {
      const bidder = row.original;
      return (
        <div className="flex justify-center">
          {bidder.registration_fee.toLocaleString()}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    size: 100,
    cell: ({ row }) => {
      const bidder = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant={bidder.status === "ACTIVE" ? "success" : "destructive"}
          >
            {bidder.status}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    size: 50,
    cell: ({ row }) => {
      const bidder = row.original;
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
              onClick={() => redirect(`/bidders/${bidder.bidder_number}`)}
            >
              View Bidder Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
