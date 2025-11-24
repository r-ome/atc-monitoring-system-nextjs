"use client";

import { ColumnDef } from "@tanstack/react-table";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { SetStateAction } from "react";
import { Badge } from "@/app/components/ui/badge";

export const columns = (
  setOpen: React.Dispatch<SetStateAction<boolean>>,
  setSelected: React.Dispatch<SetStateAction<PaymentMethod>>
): ColumnDef<PaymentMethod>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Payment Method
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment_method = row.original;
      return (
        <div
          className="flex justify-center hover:underline hover:cursor-pointer"
          onClick={() => {
            setOpen(true);
            setSelected(payment_method);
          }}
        >
          {payment_method.name}
        </div>
      );
    },
  },
  {
    accessorKey: "state",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            State
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment_method = row.original;
      return (
        <div className="flex justify-center">
          <Badge
            variant={
              payment_method.state === "ENABLED" ? "success" : "destructive"
            }
          >
            {payment_method.state}
          </Badge>
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
            Date Created
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment_method = row.original;
      return (
        <div className="flex justify-center">{payment_method.created_at}</div>
      );
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Date Updated
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const payment_method = row.original;
      return (
        <div className="flex justify-center">{payment_method.updated_at}</div>
      );
    },
  },
];
