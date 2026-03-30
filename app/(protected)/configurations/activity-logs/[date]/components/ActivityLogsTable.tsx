"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { StatusBadge } from "@/app/components/admin";
import { ActivityLog, ActivityAction } from "src/entities/models/ActivityLog";

function actionVariant(action: ActivityAction) {
  if (action === "CREATE") return "success";
  if (action === "UPDATE") return "info";
  return "error";
}

const columns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: "created_at",
    header: "Time",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">{row.original.created_at}</div>
    ),
  },
  {
    accessorKey: "username",
    header: "User",
  },
  {
    accessorKey: "branch_name",
    header: "Branch",
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <StatusBadge variant={actionVariant(row.original.action)}>
        {row.original.action}
      </StatusBadge>
    ),
  },
  {
    accessorKey: "entity_type",
    header: "Entity",
    cell: ({ row }) => (
      <span className="capitalize">{row.original.entity_type.replace(/_/g, " ")}</span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
  },
];

interface ActivityLogsTableProps {
  logs: ActivityLog[];
}

export const ActivityLogsTable = ({ logs }: ActivityLogsTableProps) => {
  return <DataTable columns={columns} data={logs} />;
};
