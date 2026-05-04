"use client";

import { usePathname, useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { BranchBadge, StatusBadge } from "@/app/components/admin";
import { ArrowUpDown } from "lucide-react";
import { parse } from "date-fns";
import { ContainerRowType } from "./container-table";

function ContainerBarcodeCell({ barcode }: { barcode: string }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div
      className="flex justify-center hover:underline hover:cursor-pointer"
      onClick={() => router.push(`${pathname}/${barcode}`)}
    >
      {barcode}
    </div>
  );
}

export const columns: ColumnDef<ContainerRowType>[] = [
  {
    id: "barcode",
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
      return <ContainerBarcodeCell barcode={container.barcode} />;
    },
  },
  {
    accessorKey: "inventories.length",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Items
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">
          {container.inventory_count} items
        </div>
      );
    },
  },
  {
    accessorKey: "supplier",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Supplier
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">{container.supplier.name}</div>
      );
    },
  },
  {
    accessorKey: "branch.name",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Branch
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">
          <BranchBadge branch={container.branch.name} />
        </div>
      );
    },
  },
  {
    accessorKey: "auction_start_date",
    sortingFn: (rowA, rowB) => {
      const parse_date = (val: string | undefined) =>
        val ? parse(val, "MMM dd, yyyy", new Date()).getTime() : 0;
      return (
        parse_date(rowA.original.auction_start_date) -
        parse_date(rowB.original.auction_start_date)
      );
    },
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Auction Date Start
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">
          {container.auction_start_date ?? "N/A"}
        </div>
      );
    },
  },
  {
    accessorKey: "due_date",
    sortingFn: (rowA, rowB) => {
      const parse_date = (val: string | undefined) =>
        val ? parse(val, "MMM dd, yyyy", new Date()).getTime() : 0;
      return parse_date(rowA.original.due_date) - parse_date(rowB.original.due_date);
    },
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Due Date
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return <div className="flex justify-center">{container.due_date}</div>;
    },
  },
  {
    accessorKey: "status",
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
      const container = row.original;
      return (
        <div className="flex justify-center">
          <StatusBadge
            variant={container.status === "PAID" ? "paid" : "unpaid"}
          >
            {container.status}
          </StatusBadge>
        </div>
      );
    },
  },
  {
    accessorKey: "paid_at",
    sortingFn: (rowA, rowB) => {
      const parse_date = (val: string | null) =>
        val ? parse(val, "MMM dd, yyyy", new Date()).getTime() : 0;
      return parse_date(rowA.original.paid_at) - parse_date(rowB.original.paid_at);
    },
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Paid Date
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">{container.paid_at ?? "N/A"}</div>
      );
    },
  },
];
