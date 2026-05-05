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

type ItemTableActivityDescription = {
  type:
    | "bought_items_upload"
    | "cancelled_items"
    | "refunded_items"
    | "add_on_items";
  summary: string;
  items: {
    barcode: string;
    control: string;
    price: string;
  }[];
};

type OptionsTableActivityDescription = {
  type: "container_report";
  summary: string;
  options: {
    option: string;
    value: string;
  }[];
};

function parseItemTableActivityDescription(
  description: string,
): ItemTableActivityDescription | null {
  try {
    const parsed = JSON.parse(description) as Partial<ItemTableActivityDescription>;
    const type = parsed.type;

    if (
      (type !== "bought_items_upload" &&
        type !== "cancelled_items" &&
        type !== "refunded_items" &&
        type !== "add_on_items") ||
      !Array.isArray(parsed.items)
    ) {
      return null;
    }

    return {
      type,
      summary: parsed.summary ?? `Uploaded bought items: ${parsed.items.length} records`,
      items: parsed.items.map((item) => ({
        barcode: item.barcode?.toString() ?? "",
        control: item.control?.toString() ?? "",
        price: item.price?.toString() ?? "",
      })),
    };
  } catch {
    return null;
  }
}

function parseOptionsTableActivityDescription(
  description: string,
): OptionsTableActivityDescription | null {
  try {
    const parsed = JSON.parse(description) as Partial<OptionsTableActivityDescription>;

    if (parsed.type !== "container_report" || !Array.isArray(parsed.options)) {
      return null;
    }

    return {
      type: "container_report",
      summary: parsed.summary ?? "Generated container report",
      options: parsed.options.map((item) => ({
        option: item.option?.toString() ?? "",
        value: item.value?.toString() ?? "",
      })),
    };
  } catch {
    return null;
  }
}

function DescriptionSummary({ summary }: { summary: string }) {
  return (
    <div className="truncate">
      <span>{summary}</span>
    </div>
  );
}

function ActivityDescriptionCell({ description }: { description: string }) {
  const itemActivity =
    parseItemTableActivityDescription(description);
  const optionsActivity = parseOptionsTableActivityDescription(description);

  if (itemActivity) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <DescriptionSummary summary={itemActivity.summary} />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-none p-3 text-xs">
          <table className="min-w-[18rem] border-collapse">
            <thead>
              <tr className="border-b border-primary-foreground/30">
                <th className="py-1 pr-3 text-left font-semibold">
                  Barcode
                </th>
                <th className="px-3 py-1 text-left font-semibold">
                  Control
                </th>
                <th className="py-1 pl-3 text-right font-semibold">Price</th>
              </tr>
            </thead>
            <tbody>
              {itemActivity.items.map((item, index) => (
                <tr
                  key={`${item.barcode}-${item.control}-${index}`}
                  className="border-b border-primary-foreground/15 last:border-0"
                >
                  <td className="py-1 pr-3">{item.barcode}</td>
                  <td className="px-3 py-1">{item.control}</td>
                  <td className="py-1 pl-3 text-right tabular-nums">
                    {item.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (optionsActivity) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <DescriptionSummary summary={optionsActivity.summary} />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-none p-3 text-xs">
          <table className="min-w-[22rem] border-collapse">
            <thead>
              <tr className="border-b border-primary-foreground/30">
                <th className="py-1 pr-3 text-left font-semibold">Option</th>
                <th className="py-1 pl-3 text-right font-semibold">Value</th>
              </tr>
            </thead>
            <tbody>
              {optionsActivity.options.map((item, index) => (
                <tr
                  key={`${item.option}-${index}`}
                  className="border-b border-primary-foreground/15 last:border-0"
                >
                  <td className="py-1 pr-3">{item.option}</td>
                  <td className="py-1 pl-3 text-right">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="truncate">
          <span>{description}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
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
      <ActivityDescriptionCell description={row.original.description} />
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
