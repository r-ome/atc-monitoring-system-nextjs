"use client";

import { ColumnDef } from "@tanstack/react-table";
import type { RegisteredBidder } from "src/entities/models/Bidder";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { AuctionStatusPill } from "@/app/(protected)/auctions/components/AuctionStatusPill";
import { cn, formatDate } from "@/app/lib/utils";
import { Checkbox } from "@/app/components/ui/checkbox";
import { useRouter } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

export type AuctionInventory = RegisteredBidder["auction_inventories"][number];

export function ManifestNumberDisplay({
  manifestNumber,
}: {
  manifestNumber?: string | null;
}) {
  if (!manifestNumber) return null;

  if (manifestNumber === "ADD ON" || manifestNumber === "BOUGHT ITEM") {
    return <AuctionStatusPill status={manifestNumber} size="sm" />;
  }

  return <span>{manifestNumber}</span>;
}

function AuctionInventoryBarcodeCell({ item }: { item: AuctionInventory }) {
  const router = useRouter();

  return (
    <div
      className="flex justify-center hover:underline hover:cursor-pointer"
      onClick={() =>
        router.push(
          `/auctions/${formatDate(
            new Date(item.auction_date),
            "yyyy-MM-dd",
          )}/monitoring/${item.auction_inventory_id}`,
        )
      }
    >
      {item.inventory.barcode}
    </div>
  );
}

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
    cell: ({ getValue, row }) => {
      const auctionInventory = row.original;
      const status = getValue<string>();

      return (
        <>
          {["UNPAID", "CANCELLED"].includes(status) ? (
            <div className="flex justify-center">
              <AuctionStatusPill status={auctionInventory.status} />
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex justify-center hover:cursor-pointer">
                  <AuctionStatusPill status={auctionInventory.status} />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-full">
                <div>
                  Receipt Number: {auctionInventory.receipt?.receipt_number}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </>
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
      return <AuctionInventoryBarcodeCell item={item} />;
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
          <ManifestNumberDisplay
            manifestNumber={auctionInventory.manifest_number}
          />
        </div>
      );
    },
  },
];
