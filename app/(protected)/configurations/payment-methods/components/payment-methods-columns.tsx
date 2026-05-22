"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { StatusBadge } from "@/app/components/admin";
import { SortableHeader } from "@/app/(protected)/auctions/components/SortableHeader";

export const columns: ColumnDef<PaymentMethod>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <SortableHeader column={column} label="Payment Method" align="left" />
    ),
    cell: ({ row }) => {
      const payment_method = row.original;
      return (
        <div className="flex justify-start text-left font-medium">
          {payment_method.name}
        </div>
      );
    },
  },
  {
    accessorKey: "state",
    size: 120,
    filterFn: "includesIn",
    header: ({ column }) => (
      <SortableHeader column={column} label="State" />
    ),
    cell: ({ row }) => {
      const payment_method = row.original;
      return (
        <div className="flex justify-center">
          <StatusBadge
            variant={
              payment_method.state === "ENABLED" ? "active" : "inactive"
            }
          >
            {payment_method.state}
          </StatusBadge>
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    size: 140,
    header: ({ column }) => (
      <SortableHeader column={column} label="Created" />
    ),
    cell: ({ row }) => {
      const payment_method = row.original;
      return (
        <div className="text-center text-muted-foreground">
          {payment_method.created_at}
        </div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    size: 140,
    header: ({ column }) => (
      <SortableHeader column={column} label="Updated" />
    ),
    cell: ({ row }) => {
      const payment_method = row.original;
      return (
        <div className="text-center text-muted-foreground">
          {payment_method.updated_at}
        </div>
      );
    },
  },
];
