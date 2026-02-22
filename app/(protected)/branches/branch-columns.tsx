"use client";

import { ColumnDef } from "@tanstack/react-table";
import { type Branch } from "src/entities/models/Branch";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";

export const columns: ColumnDef<Branch>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Branch Name
          <ArrowUpDown />
        </Button>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Created At",
  },
];
