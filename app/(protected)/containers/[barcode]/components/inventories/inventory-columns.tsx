"use client";

import { usePathname, useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { InventoryStatusBadge } from "@/app/components/admin";
import { ArrowUpDown } from "lucide-react";
import { InventoryRowType } from "./ContainerInventoriesTable";

function InventoryBarcodeCell({
  barcode,
  inventoryId,
}: {
  barcode: string;
  inventoryId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="flex justify-center hover:cursor-pointer hover:underline"
      onClick={() => router.push(`${pathname}/inventories/${inventoryId}`)}
    >
      {barcode}
    </div>
  );
}

export const columns: ColumnDef<InventoryRowType>[] = [
  {
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
        <InventoryBarcodeCell
          barcode={container.barcode}
          inventoryId={container.inventory_id}
        />
      );
    },
  },
  {
    accessorKey: "control",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Control Number
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const inventory = row.original;
      return (
        <div className="flex justify-center">
          {inventory.control ? inventory.control : "NC"}
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
      const inventory = row.original;
      return <div className="flex justify-center">{inventory.description}</div>;
    },
  },
  {
    accessorKey: "status",
    size: 100,
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
    cell: ({ row }) => {
      const inventory = row.original;
      return (
        <div className="flex justify-center">
          <InventoryStatusBadge status={inventory.status} />
        </div>
      );
    },
  },
  {
    accessorKey: "auction_date",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Auction Date
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const inventory = row.original;
      return (
        <div className="flex justify-center">{inventory.auction_date}</div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
  },
  // {
  //   id: "actions",
  //   enableHiding: false,
  //   size: 50,
  //   cell: ({ row }) => {
  //     const inventory = row.original;
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
  //                 `${inventory.container.barcode}/inventories/${inventory.inventory_id}`
  //               )
  //             }
  //           >
  //             View Item
  //           </DropdownMenuItem>
  //         </DropdownMenuContent>
  //       </DropdownMenu>
  //     );
  //   },
  // },
];
