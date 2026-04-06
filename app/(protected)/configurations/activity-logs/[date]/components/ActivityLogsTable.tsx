"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { BranchBadge, StatusBadge } from "@/app/components/admin";
import { ActivityLog, ActivityAction } from "src/entities/models/ActivityLog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { SearchComponent } from "@/app/components/data-table/SearchComponent";
import { FilterColumnComponent } from "@/app/components/data-table/FilterColumnComponent";
import { Button } from "@/app/components/ui/button";
import { RefreshCw } from "lucide-react";

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
    cell: ({ row }) => <BranchBadge branch={row.original.branch_name} />,
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
      <span className="capitalize">
        {row.original.entity_type.replace(/_/g, " ")}
      </span>
    ),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="truncate">
            <span>{row.original.description}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>{row.original.description}</TooltipContent>
      </Tooltip>
    ),
  },
];

interface ActivityLogsTableProps {
  logs: ActivityLog[];
}

export const ActivityLogsTable = ({ logs }: ActivityLogsTableProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  const branchOptions = useMemo(
    () =>
      Array.from(new Set(logs.map((l) => l.branch_name).filter(Boolean))).map(
        (b) => ({ label: b, value: b }),
      ),
    [logs],
  );

  const userOptions = useMemo(
    () =>
      Array.from(new Set(logs.map((l) => l.username).filter(Boolean))).map(
        (u) => ({ label: u, value: u }),
      ),
    [logs],
  );

  const entityOptions = useMemo(
    () =>
      Array.from(new Set(logs.map((l) => l.entity_type).filter(Boolean))).map(
        (entity) => ({
          label: entity.replace(/_/g, " "),
          value: entity,
        }),
      ),
    [logs],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((log) => {
      if (selectedBranches.length > 0 && !selectedBranches.includes(log.branch_name)) return false;
      if (selectedUsers.length > 0 && !selectedUsers.includes(log.username)) return false;
      if (selectedEntities.length > 0 && !selectedEntities.includes(log.entity_type)) return false;
      if (q) {
        return (
          log.username?.toLowerCase().includes(q) ||
          log.branch_name?.toLowerCase().includes(q) ||
          log.description?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [logs, search, selectedBranches, selectedEntities, selectedUsers]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="w-full md:w-2/4">
          <SearchComponent
            value={search}
            onChangeEvent={setSearch}
            placeholder="Search user, branch, or description..."
          />
        </div>
        <FilterColumnComponent
          options={branchOptions}
          onChangeEvent={setSelectedBranches}
          placeholder="Filter by branch"
        />
        <FilterColumnComponent
          options={userOptions}
          onChangeEvent={setSelectedUsers}
          placeholder="Filter by user"
        />
        <FilterColumnComponent
          options={entityOptions}
          onChangeEvent={setSelectedEntities}
          placeholder="Filter by entity"
        />
        <Button
          variant="outline"
          size="icon"
          disabled={isPending}
          onClick={() => startTransition(() => router.refresh())}
          title="Refresh"
        >
          <RefreshCw className={isPending ? "animate-spin" : ""} />
        </Button>
      </div>
      <DataTable columns={columns} data={filtered} />
    </div>
  );
};
