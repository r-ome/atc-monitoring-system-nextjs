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
    size: 150,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="cursor-pointer flex justify-center"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Bidder Number
          <ArrowUpDown />
        </Button>
      );
    },
  },
  {
    accessorKey: "full_name",
    enableResizing: true,
    size: 220,
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
    header: "Birth Date",
    size: 100,
  },
  {
    accessorKey: "service_charge",
    header: "Service Charge(%)",
    size: 130,
    cell: ({ row }) => {
      const bidder = row.original;
      return <div>{bidder.service_charge}%</div>;
    },
  },
  {
    accessorKey: "contact_number",
    header: "Contact",
    size: 100,
    cell: ({ row }) => {
      const bidder = row.original;
      return <div>{bidder.contact_number}</div>;
    },
  },
  {
    accessorKey: "registration_fee",
    header: "Registration Fee",
    size: 100,
    cell: ({ row }) => {
      const bidder = row.original;
      return <div>{bidder.registration_fee.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 100,
    cell: ({ row }) => {
      const bidder = row.original;
      return (
        <Badge variant={bidder.status === "ACTIVE" ? "success" : "destructive"}>
          {bidder.status}
        </Badge>
        // <div
        //   className={clsx({
        //     "w-fit px-2 rounded text-white tracking-wider shadow-sm": true,
        //     "bg-green-500": row.getValue("status") === "ACTIVE",
        //     "bg-red-500": ["INACTIVE", "BANNED"].includes(
        //       row.getValue("status")
        //     ),
        //   })}
        // >
        //   {row.getValue("status")}
        // </div>
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
