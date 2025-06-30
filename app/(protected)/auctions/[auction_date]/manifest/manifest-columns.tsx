"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Manifest } from "src/entities/models/Manifest";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils";

export const columns: ColumnDef<Manifest>[] = [
  {
    accessorKey: "barcode",
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
      const manifest = row.original;
      return <div className="flex justify-center"> {manifest.barcode}</div>;
    },
  },
  {
    accessorKey: "control",
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
    cell: ({ row }) => {
      const manifest = row.original;
      return <div className="flex justify-center">{manifest.control}</div>;
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
      const manifest = row.original;
      return <div className="flex justify-center">{manifest.description}</div>;
    },
  },
  {
    accessorKey: "bidder_number",
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
      const manifest = row.original;
      return (
        <div className="flex justify-center">{manifest.bidder_number}</div>
      );
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
      const manifest = row.original;
      return (
        <div className="flex justify-center">
          {manifest.price ? manifest.price : null}
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
      const manifest = row.original;
      return (
        <div className="flex justify-center">{manifest.manifest_number}</div>
      );
    },
  },
  {
    accessorKey: "error_message",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Error
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const manifest = row.original;
      return (
        <div
          className={cn(
            "flex justify-start truncate",
            manifest.error_message ? "text-red-500" : "text-green-500"
          )}
        >
          <Tooltip>
            <TooltipTrigger>
              {manifest.error_message ? manifest.error_message : "ENCODED"}
            </TooltipTrigger>
            <TooltipContent>
              {manifest.error_message ? manifest.error_message : "ENCODED"}
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
];
