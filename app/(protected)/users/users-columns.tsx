"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { User } from "src/entities/models/User";
import { Badge } from "@/app/components/ui/badge";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return <div className="flex justify-center">{user.name}</div>;
    },
  },
  {
    accessorKey: "username",
    enableResizing: true,
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Username
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return <div className="flex justify-center">{user.username}</div>;
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      return (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="cursor-pointer flex justify-center"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Role
            <ArrowUpDown />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex justify-center">
          <Badge>{user.role}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "branch.name",
    enableResizing: true,
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
      const user = row.original;
      return <div className="flex justify-center">{user.branch.name}</div>;
    },
  },
  {
    accessorKey: "created_at",
    enableResizing: true,
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Registered At
          <ArrowUpDown />
        </Button>
      );
    },
  },
];
