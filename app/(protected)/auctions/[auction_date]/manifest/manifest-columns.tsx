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
import { cn, formatDate } from "@/app/lib/utils";
import { SetStateAction } from "react";

import { createGroupSortingFn } from "@/app/lib/utils";

const controlGroupSortingFn = createGroupSortingFn<Manifest, string>(
  (row) => row.is_slash_item ?? row.manifest_id,
  (row) => row.control ?? "",
  (a, b) => a.localeCompare(b)
);

export const columns = (
  setOpen: React.Dispatch<SetStateAction<boolean>>,
  setSelected: React.Dispatch<SetStateAction<Manifest>>,
  groupIndexMap: Record<string, number>
): ColumnDef<Manifest>[] => [
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
      return (
        <div
          className="flex justify-center hover:underline hover:cursor-pointer"
          onClick={() => {
            if (manifest.error_message !== "") {
              setOpen(true);
              setSelected(manifest);
            }
          }}
        >
          {manifest.barcode}
        </div>
      );
    },
  },
  {
    accessorKey: "control",
    size: 100,
    sortingFn: controlGroupSortingFn,
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
      const is_slash_item = manifest.is_slash_item;
      const idx = is_slash_item ? groupIndexMap[is_slash_item] : undefined;

      console.log(idx);
      return (
        <div className="flex justify-center">
          {manifest.control} {idx ? `(A${idx})` : ""}
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
      const manifest = row.original;
      return <div className="flex justify-center">{manifest.qty}</div>;
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
          {manifest.price
            ? parseInt(manifest.price, 10).toLocaleString()
            : null}
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
    accessorKey: "created_at",
    size: 80,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Uploaded Date
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const manifest = row.original;
      return (
        <div className="flex justify-center">
          {formatDate(new Date(manifest.created_at), "MMM dd hh:mm a")}
        </div>
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
            "flex justify-center truncate",
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
