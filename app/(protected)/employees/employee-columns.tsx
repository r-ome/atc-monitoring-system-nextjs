"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Employee } from "src/entities/models/Employee";
import { Button } from "@/app/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { BranchBadge, StatusBadge } from "@/app/components/admin/status-badge";
import type { BranchBadgeValue } from "@/app/components/admin/status-badge.helpers";

export const getColumns = (isAdmin: boolean): ColumnDef<Employee>[] => [
  {
    accessorKey: "full_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <ArrowUpDown />
      </Button>
    ),
  },
  {
    accessorKey: "position",
    header: () => <div className="text-center">Position</div>,
    cell: ({ row }) => <div className="text-center">{row.original.position ?? "—"}</div>,
  },
  {
    accessorKey: "worker_type",
    header: () => <div className="text-center">Worker Type</div>,
    filterFn: "includesIn",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <StatusBadge variant={row.original.worker_type === "REGULAR_WORKER" ? "success" : "neutral"}>
          {row.original.worker_type === "REGULAR_WORKER" ? "Regular" : "Extra"}
        </StatusBadge>
      </div>
    ),
  },
  {
    id: "base_pay",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Base Pay
          <ArrowUpDown />
        </Button>
      </div>
    ),
    accessorFn: (row) => {
      if (row.salary_type === "DAILY_RATE") return Number(row.default_daily_rate ?? 0);
      if (row.salary_type === "FIXED_MONTHLY") return Number(row.default_monthly_salary ?? 0);
      return 0;
    },
    cell: ({ row }) => {
      const { salary_type, default_daily_rate, default_monthly_salary } = row.original;
      if (salary_type === "DAILY_RATE" && default_daily_rate != null)
        return <div className="text-center">₱{Number(default_daily_rate).toLocaleString()}<span className="text-muted-foreground text-xs">/day</span></div>;
      if (salary_type === "FIXED_MONTHLY" && default_monthly_salary != null)
        return <div className="text-center">₱{Number(default_monthly_salary).toLocaleString()}<span className="text-muted-foreground text-xs">/cutoff</span></div>;
      return <div className="text-center text-muted-foreground">—</div>;
    },
  },
  ...(isAdmin ? [{
    id: "branch",
    accessorFn: (row: Employee) => row.branch.name,
    header: "Branch",
    cell: ({ row }: { row: { original: Employee } }) => (
      <BranchBadge branch={row.original.branch.name as BranchBadgeValue} />
    ),
  } satisfies ColumnDef<Employee>] : []),
];
