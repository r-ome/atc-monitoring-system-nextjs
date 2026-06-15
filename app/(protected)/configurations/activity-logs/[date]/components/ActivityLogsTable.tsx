"use client";

import { forwardRef, useMemo, useTransition } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CoreRow, ColumnDef, Row } from "@tanstack/react-table";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { SortableHeader } from "@/app/(protected)/auctions/components/SortableHeader";
import { BranchBadge } from "@/app/components/admin";
import { cn, formatDate, formatNumberToCurrency } from "@/app/lib/utils";
import { ActivityLog } from "src/entities/models/ActivityLog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import { Activity, RefreshCw } from "lucide-react";
import {
  formatPlainExpenseDescription,
  formatUpdateChangeValue,
  parseUpdateActivityDescription,
} from "@/app/lib/activity-log-description";

type ItemTableActivityDescription = {
  type:
    | "bought_items_upload"
    | "cancelled_items"
    | "refunded_items"
    | "add_on_items"
    | "merged_inventories";
  summary: string;
  reason: string | null;
  items: {
    barcode: string;
    control: string;
    description: string;
    bidder_number: string;
    price: string;
  }[];
};

type OptionsTableActivityDescription = {
  type: "container_report" | "final_report_generated";
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
  reason?: unknown,
) {
  if (typeof reason === "string" && reason.trim()) {
    return reason.trim();
  }

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
        type !== "add_on_items" &&
        type !== "merged_inventories") ||
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
      reason: getItemActivityReason(type, summary, parsed.reason),
      items: parsed.items.map((item) => ({
        barcode: item.barcode?.toString() ?? "",
        control: item.control?.toString() ?? "",
        description: item.description?.toString() ?? "",
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
    ) as Partial<OptionsTableActivityDescription> & {
      data?: { option?: unknown; value?: unknown }[];
      files?: {
        variant?: unknown;
        filename?: unknown;
        version?: unknown;
        size_bytes?: unknown;
      }[];
    };

    if (
      (parsed.type !== "container_report" &&
        parsed.type !== "final_report_generated") ||
      !Array.isArray(parsed.options)
    ) {
      return null;
    }

    const summary =
      parsed.summary ??
      (parsed.type === "final_report_generated"
        ? "Generated final report"
        : "Generated container report");
    const barcode =
      parsed.barcode?.toString() ??
      summary.match(
        /^Generated (?:container|(?:original |modified )?final) report(?: preview)? for ([^(]+?)(?:\s+\(|$)/,
      )?.[1]?.trim() ??
      null;
    const dataRows = Array.isArray(parsed.data)
      ? parsed.data.map((item) => ({
          option: item.option?.toString() ?? "",
          value: item.value?.toString() ?? "",
        }))
      : [];
    const fileRows = Array.isArray(parsed.files)
      ? parsed.files.map((file) => ({
          option: `File ${file.variant?.toString() ?? ""}`.trim(),
          value: [
            file.filename?.toString() ?? "",
            file.version != null ? `v${file.version}` : "",
            file.size_bytes != null ? `${file.size_bytes} bytes` : "",
          ]
            .filter(Boolean)
            .join(" · "),
        }))
      : [];

    return {
      type: parsed.type,
      summary,
      barcode,
      options: [
        ...parsed.options.map((item) => ({
          option: item.option?.toString() ?? "",
          value: item.value?.toString() ?? "",
        })),
        ...dataRows,
        ...fileRows,
      ],
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
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { summary: string }
>(({ summary, className, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "block w-full truncate bg-transparent p-0 text-left underline-offset-4",
        className,
      )}
      {...props}
    >
      <span>{summary}</span>
    </button>
  );
});
DescriptionSummary.displayName = "DescriptionSummary";

function ActivityDescriptionCell({
  description,
  variant = "tooltip",
}: {
  description: string;
  variant?: "tooltip" | "popover";
}) {
  const itemActivity = parseItemTableActivityDescription(description);
  const optionsActivity = parseOptionsTableActivityDescription(description);
  const updateActivity = parseUpdateActivityDescription(description);
  const hasBidderNumbers = itemActivity?.items.some(
    (item) => item.bidder_number,
  );
  const hasDescriptions = itemActivity?.items.some(
    (item) => item.description,
  );

  const isPopover = variant === "popover";
  const Root = isPopover ? Popover : Tooltip;
  const Trigger = isPopover ? PopoverTrigger : TooltipTrigger;
  const Content = isPopover ? PopoverContent : TooltipContent;
  const overlayClass = isPopover
    ? "w-[min(24rem,calc(100vw-2rem))] overflow-hidden"
    : "w-fit max-w-[min(34rem,calc(100vw-2rem))] overflow-hidden shadow-md";
  const overlayProps = isPopover
    ? { align: "start" as const, collisionPadding: 16, sideOffset: 6 }
    : { collisionPadding: 16, side: "right" as const };
  const triggerClass = isPopover ? "cursor-pointer hover:underline" : undefined;
  const updateOverlayClass = isPopover
    ? "w-[min(24rem,calc(100vw-2rem))] overflow-hidden"
    : "w-[min(28rem,calc(100vw-2rem))] overflow-hidden shadow-md";
  // Keep scrolling on this non-animated inner element so the overlay's
  // entrance animation can't briefly flash a scrollbar on small content.
  const Overlay = ({
    children,
    className,
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <Content {...overlayProps} className={className ?? overlayClass}>
      <div
        className={cn(
          "max-h-[70vh] overflow-auto text-xs",
          isPopover && "p-3",
        )}
      >
        {children}
      </div>
    </Content>
  );

  if (itemActivity) {
    return (
      <Root>
        <Trigger asChild>
          <DescriptionSummary
            summary={itemActivity.summary}
            className={triggerClass}
          />
        </Trigger>
        <Overlay>
          {itemActivity.reason ? (
            <div className="mb-2 border-b border-current/25 pb-2">
              <div className="font-semibold">Reason</div>
              <div className="mt-0.5 max-w-[22rem] whitespace-normal">
                {itemActivity.reason}
              </div>
            </div>
          ) : null}
          <div className={isPopover ? "overflow-x-auto" : undefined}>
            <table
              className={
                isPopover ? "border-collapse" : "min-w-[18rem] border-collapse"
              }
            >
              <thead>
                <tr className="border-b border-current/25">
                  <th className="py-1 pr-3 text-left font-semibold">
                    Barcode
                  </th>
                  <th className="px-3 py-1 text-left font-semibold">
                    Control
                  </th>
                  {hasDescriptions ? (
                    <th className="px-3 py-1 text-left font-semibold">
                      Description
                    </th>
                  ) : null}
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
                    className="border-b border-current/10 last:border-0"
                  >
                    <td className="py-1 pr-3">{item.barcode}</td>
                    <td className="px-3 py-1">{item.control}</td>
                    {hasDescriptions ? (
                      <td className="max-w-[18rem] px-3 py-1 whitespace-normal">
                        {item.description}
                      </td>
                    ) : null}
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
          </div>
        </Overlay>
      </Root>
    );
  }

  if (optionsActivity) {
    return (
      <Root>
        <Trigger asChild>
          <DescriptionSummary
            summary={optionsActivity.summary}
            className={triggerClass}
          />
        </Trigger>
        <Overlay>
          <div className="mb-2 border-b border-current/25 pb-2 font-semibold">
            {optionsActivity.barcode ?? "Container Report"}
          </div>
          <div className={isPopover ? "overflow-x-auto" : undefined}>
            <table
              className={
                isPopover
                  ? "w-full border-collapse"
                  : "min-w-[22rem] border-collapse"
              }
            >
              <thead>
                <tr className="border-b border-current/25">
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
                    className="border-b border-current/10 last:border-0"
                  >
                    <td className="w-1/2 py-1 pr-3 align-center">
                      {item.option}
                    </td>
                    <td className="w-1/2 py-1 pl-3 text-right align-top whitespace-normal break-words">
                      <OptionValue option={item.option} value={item.value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Overlay>
      </Root>
    );
  }

  if (updateActivity) {
    return (
      <Root>
        <Trigger asChild>
          <DescriptionSummary summary={description} className={triggerClass} />
        </Trigger>
        <Overlay className={updateOverlayClass}>
          <div className="mb-2 border-b border-current/25 pb-2 font-semibold whitespace-normal break-words">
            {updateActivity.title}
          </div>
          <div className={isPopover ? "overflow-x-auto" : undefined}>
            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr className="border-b border-current/25">
                  <th className="w-[32%] py-1 pr-3 text-left font-semibold">
                    Field
                  </th>
                  <th className="w-[34%] px-3 py-1 text-left font-semibold">
                    Before
                  </th>
                  <th className="w-[34%] py-1 pl-3 text-left font-semibold">
                    After
                  </th>
                </tr>
              </thead>
              <tbody>
                {updateActivity.changes.map((change, index) => (
                  <tr
                    key={`${change.field}-${index}`}
                    className="border-b border-current/10 last:border-0"
                  >
                    <td className="py-1 pr-3 font-medium whitespace-nowrap">
                      {change.field}
                    </td>
                    <td className="px-3 py-1 whitespace-normal break-words">
                      {formatUpdateChangeValue(change.field, change.before)}
                    </td>
                    <td className="py-1 pl-3 whitespace-normal break-words">
                      {formatUpdateChangeValue(change.field, change.after)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Overlay>
      </Root>
    );
  }

  const displayDescription = formatPlainExpenseDescription(description);

  return (
    <Root>
      <Trigger asChild>
        <button
          type="button"
          className={cn(
            "block w-full truncate bg-transparent p-0 text-left underline-offset-4",
            triggerClass,
          )}
        >
          <span>{displayDescription}</span>
        </button>
      </Trigger>
      <Overlay>
        {displayDescription}
      </Overlay>
    </Root>
  );
}

const columns: ColumnDef<ActivityLog>[] = [
  {
    accessorKey: "created_at",
    size: 120,
    minSize: 120,
    header: ({ column }) => (
      <SortableHeader column={column} label="Time" align="left" />
    ),
    cell: ({ row }) => (
      <div className="whitespace-nowrap text-left text-muted-foreground tabular-nums">
        {formatDate(new Date(row.original.created_at), "hh:mm:ss a")}
      </div>
    ),
  },
  {
    accessorKey: "username",
    size: 120,
    minSize: 100,
    enableColumnFilter: true,
    filterFn: "includesIn" as never,
    header: ({ column }) => (
      <SortableHeader column={column} label="User" align="left" />
    ),
    cell: ({ row }) => (
      <div className="truncate text-left">{row.original.username}</div>
    ),
  },
  {
    accessorKey: "branch_name",
    size: 110,
    minSize: 90,
    enableColumnFilter: true,
    filterFn: "includesIn" as never,
    header: ({ column }) => (
      <SortableHeader column={column} label="Branch" align="left" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-start">
        <BranchBadge branch={row.original.branch_name} />
      </div>
    ),
  },
  {
    accessorKey: "description",
    minSize: 480,
    header: () => <div className="text-left text-muted-foreground">Description</div>,
    cell: ({ row }) => (
      <div className="text-left">
        <ActivityDescriptionCell
          description={row.original.description}
          variant="tooltip"
        />
      </div>
    ),
  },
];

interface ActivityLogsTableProps {
  logs: ActivityLog[];
  date: string;
}

export const ActivityLogsTable = ({ logs, date }: ActivityLogsTableProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  const globalFilterFn = (
    row: CoreRow<ActivityLog>,
    _columnId?: string,
    filterValue?: string,
  ) => {
    const q = (filterValue ?? "").toLowerCase();
    if (!q) return true;
    const log = row.original;
    return (
      log.username?.toLowerCase().includes(q) ||
      log.branch_name?.toLowerCase().includes(q) ||
      log.description?.toLowerCase().includes(q) ||
      log.entity_type?.toLowerCase().includes(q)
    );
  };

  return (
    <AuctionDataTable
      icon={Activity}
      title={
        <div className="flex items-baseline gap-2">
          <span className="text-[16px] font-semibold 2xl:text-[19.5px]">
            Activity Logs
          </span>
          <span className="text-[13px] font-normal text-muted-foreground 2xl:text-[15px]">
            {date}
          </span>
        </div>
      }
      meta={`${logs.length.toLocaleString()} entries`}
      rowLabel="entry"
      columns={columns}
      data={logs}
      initialSorting={[{ id: "created_at", desc: true }]}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search user, branch, or description…",
        },
      }}
      columnFilters={[
        {
          column: "branch_name",
          options: branchOptions,
          filterComponentProps: { placeholder: "Filter by branch" },
        },
        {
          column: "username",
          options: userOptions,
          filterComponentProps: { placeholder: "Filter by user" },
        },
      ]}
      actionButtons={
        <Button
          variant="outline"
          size="icon"
          disabled={isPending}
          onClick={() => startTransition(() => router.refresh())}
          title="Refresh"
        >
          <RefreshCw className={isPending ? "animate-spin" : ""} />
        </Button>
      }
      renderMobileCard={renderActivityLogMobileCard}
    />
  );
};

function renderActivityLogMobileCard(row: Row<ActivityLog>) {
  const log = row.original;
  return (
    <div className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <BranchBadge branch={log.branch_name} />
        <span className="whitespace-nowrap font-mono text-[12.5px] text-muted-foreground">
          {formatDate(new Date(log.created_at), "hh:mm:ss a")}
        </span>
      </div>
      <div className="text-[14.5px] leading-snug break-words">
        <ActivityDescriptionCell
          description={log.description}
          variant="popover"
        />
      </div>
      <div className="truncate text-[12.5px] text-muted-foreground">
        {log.username}
      </div>
    </div>
  );
}
