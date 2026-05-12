"use client";

import { forwardRef, useMemo, useState, useTransition } from "react";
import type { HTMLAttributes } from "react";
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
  reason: string | null;
  items: {
    barcode: string;
    control: string;
    bidder_number: string;
    price: string;
  }[];
};

type OptionsTableActivityDescription = {
  type: "container_report";
  summary: string;
  barcode: string | null;
  options: {
    option: string;
    value: string;
  }[];
};

function getItemActivityReason(
  type: ItemTableActivityDescription["type"],
  summary: string,
) {
  if (type === "cancelled_items") {
    return (
      summary
        .match(/^Cancelled \d+ item\(s\) from bidder #[^:]+:\s*(.+)$/)?.[1]
        ?.trim() ?? null
    );
  }

  if (type === "refunded_items") {
    return summary.match(/^Refunded \d+ item\(s\):\s*(.+)$/)?.[1]?.trim() ?? null;
  }

  return null;
}

function parseItemTableActivityDescription(
  description: string,
): ItemTableActivityDescription | null {
  try {
    const parsed = JSON.parse(
      description,
    ) as Partial<ItemTableActivityDescription>;
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

    const summary =
      parsed.summary ??
      `Uploaded bought items: ${parsed.items.length} records`;

    return {
      type,
      summary,
      reason: getItemActivityReason(type, summary),
      items: parsed.items.map((item) => ({
        barcode: item.barcode?.toString() ?? "",
        control: item.control?.toString() ?? "",
        bidder_number: item.bidder_number?.toString() ?? "",
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
    const parsed = JSON.parse(
      description,
    ) as Partial<OptionsTableActivityDescription>;

    if (parsed.type !== "container_report" || !Array.isArray(parsed.options)) {
      return null;
    }

    const summary = parsed.summary ?? "Generated container report";
    const barcode =
      parsed.barcode?.toString() ??
      summary
        .match(/^Generated container report for ([^(]+?)(?:\s+\(|$)/)?.[1]
        ?.trim() ??
      null;

    return {
      type: "container_report",
      summary,
      barcode,
      options: parsed.options.map((item) => ({
        option: item.option?.toString() ?? "",
        value: item.value?.toString() ?? "",
      })),
    };
  } catch {
    return null;
  }
}

function OptionValue({ option, value }: { option: string; value: string }) {
  if (option === "Auction dates") {
    const dates =
      value.match(/[A-Za-z]+ \d{1,2}, \d{4}/g) ??
      value
        .split(",")
        .map((date) => date.trim())
        .filter(Boolean);

    return (
      <div className="flex flex-col items-end gap-0.5">
        {dates.map((date, index) => (
          <span key={`${date}-${index}`} className="whitespace-nowrap">
            {date}
          </span>
        ))}
      </div>
    );
  }

  return <>{value}</>;
}

const DescriptionSummary = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & { summary: string }
>(({ summary, ...props }, ref) => {
  return (
    <div ref={ref} className="truncate" {...props}>
      <span>{summary}</span>
    </div>
  );
});
DescriptionSummary.displayName = "DescriptionSummary";

function ActivityDescriptionCell({ description }: { description: string }) {
  const itemActivity = parseItemTableActivityDescription(description);
  const optionsActivity = parseOptionsTableActivityDescription(description);
  const hasBidderNumbers = itemActivity?.items.some(
    (item) => item.bidder_number,
  );

  if (itemActivity) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <DescriptionSummary summary={itemActivity.summary} />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-none p-3 text-xs">
          {itemActivity.reason ? (
            <div className="mb-2 border-b border-primary-foreground/30 pb-2">
              <div className="font-semibold">Reason</div>
              <div className="mt-0.5 max-w-[22rem] whitespace-normal">
                {itemActivity.reason}
              </div>
            </div>
          ) : null}
          <table className="min-w-[18rem] border-collapse">
            <thead>
              <tr className="border-b border-primary-foreground/30">
                <th className="py-1 pr-3 text-left font-semibold">Barcode</th>
                <th className="px-3 py-1 text-left font-semibold">Control</th>
                {hasBidderNumbers ? (
                  <th className="px-3 py-1 text-left font-semibold">
                    Bidder #
                  </th>
                ) : null}
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
                  {hasBidderNumbers ? (
                    <td className="px-3 py-1">{item.bidder_number}</td>
                  ) : null}
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
          <div className="mb-2 border-b border-primary-foreground/30 pb-2 font-semibold">
            {optionsActivity.barcode ?? "Container Report"}
          </div>
          <table className="min-w-[22rem] border-collapse">
            <thead>
              <tr className="border-b border-primary-foreground/30">
                <th className="w-1/2 py-1 pr-3 text-left font-semibold">
                  Option
                </th>
                <th className="w-1/2 py-1 pl-3 text-right font-semibold">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {optionsActivity.options.map((item, index) => (
                <tr
                  key={`${item.option}-${index}`}
                  className="border-b border-primary-foreground/15 last:border-0"
                >
                  <td className="w-1/2 py-1 pr-3 align-center">
                    {item.option}
                  </td>
                  <td className="w-1/2 py-1 pl-3 text-right align-top">
                    <OptionValue option={item.option} value={item.value} />
                  </td>
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
      if (
        selectedBranches.length > 0 &&
        !selectedBranches.includes(log.branch_name)
      )
        return false;
      if (selectedUsers.length > 0 && !selectedUsers.includes(log.username))
        return false;
      if (
        selectedEntities.length > 0 &&
        !selectedEntities.includes(log.entity_type)
      )
        return false;
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
