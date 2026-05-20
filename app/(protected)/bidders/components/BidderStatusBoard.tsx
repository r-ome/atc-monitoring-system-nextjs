"use client";

import { useState } from "react";
import { UserCheck, UserMinus, Ban, LucideIcon } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";
import {
  BiddersTable,
  type BidderRowType,
} from "@/app/(protected)/bidders/components/bidders-table";

type Status = "ACTIVE" | "INACTIVE" | "BANNED";

const VARIANT_STYLES: Record<
  Status,
  { card: string; label: string; icon: string; selected: string }
> = {
  ACTIVE: {
    card: "border-status-success/20 bg-status-success/5",
    label: "text-status-success",
    icon: "text-status-success",
    selected:
      "bg-status-success/10 text-status-success ring-1 ring-status-success/30",
  },
  INACTIVE: {
    card: "border-border",
    label: "text-muted-foreground",
    icon: "text-muted-foreground",
    selected: "bg-secondary text-foreground ring-1 ring-border",
  },
  BANNED: {
    card: "border-status-error/20 bg-status-error/5",
    label: "text-status-error",
    icon: "text-status-error",
    selected:
      "bg-status-error/10 text-status-error ring-1 ring-status-error/30",
  },
};

type Selection = { status: Status; branch: string } | null;

function BidderStatCard({
  title,
  value,
  icon: Icon,
  status,
  branches,
  showBranches,
  selection,
  onToggleBranch,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  status: Status;
  branches: { name: string; count: number }[];
  showBranches: boolean;
  selection: Selection;
  onToggleBranch: (status: Status, branch: string) => void;
}) {
  const styles = VARIANT_STYLES[status];

  return (
    <Card className={cn("relative min-w-0 overflow-hidden", styles.card)}>
      <div className="px-4 py-4 sm:px-6">
        <div
          className={
            showBranches
              ? "flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_1px_1fr] sm:items-center sm:gap-3.5"
              : "flex flex-col gap-3"
          }
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon size={11} className={styles.icon} />
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-widest 2xl:text-[14px]",
                    styles.label,
                  )}
                >
                  {title}
                </span>
              </div>
              <div
                className={cn(
                  "font-mono text-[22px] font-semibold leading-tight tracking-tight 2xl:text-[26px]",
                  styles.label,
                )}
              >
                {value.toLocaleString()}
              </div>
            </div>
          </div>

          {showBranches && (
            <>
              <div className="hidden h-10 bg-border sm:block" />
              <div className="flex flex-col gap-1">
                {branches.map((b) => {
                  const isSelected =
                    selection?.status === status &&
                    selection.branch === b.name;
                  return (
                    <button
                      type="button"
                      key={b.name}
                      onClick={() => onToggleBranch(status, b.name)}
                      aria-pressed={isSelected}
                      className={cn(
                        "flex cursor-pointer items-baseline gap-1.5 rounded px-1.5 py-0.5 text-left transition-colors hover:bg-secondary/60",
                        isSelected && styles.selected,
                      )}
                    >
                      <span className="min-w-[48px] text-[11px] font-semibold tracking-wide 2xl:text-[15px]">
                        {b.name.toUpperCase()}
                      </span>
                      <span
                        className={cn(
                          "ml-auto font-mono text-[12px] font-medium 2xl:text-[16px]",
                          isSelected && "font-semibold",
                        )}
                      >
                        {b.count.toLocaleString()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

interface BidderStatusBoardProps {
  bidders: BidderRowType[];
  canViewAll: boolean;
  counts: Record<Status, { total: number; branches: { name: string; count: number }[] }>;
}

export function BidderStatusBoard({
  bidders,
  canViewAll,
  counts,
}: BidderStatusBoardProps) {
  const [selection, setSelection] = useState<Selection>(null);

  const onToggleBranch = (status: Status, branch: string) => {
    setSelection((current) =>
      current?.status === status && current.branch === branch
        ? null
        : { status, branch },
    );
  };

  const initialFilters = selection
    ? [
        { id: "status", value: [selection.status] },
        { id: "branch_name", value: [selection.branch] },
      ]
    : undefined;

  const tableKey = selection
    ? `${selection.status}-${selection.branch}`
    : "default";

  return (
    <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <BidderStatCard
          title="Active Bidders"
          value={counts.ACTIVE.total}
          icon={UserCheck}
          status="ACTIVE"
          branches={counts.ACTIVE.branches}
          showBranches={canViewAll}
          selection={selection}
          onToggleBranch={onToggleBranch}
        />
        <BidderStatCard
          title="Inactive Bidders"
          value={counts.INACTIVE.total}
          icon={UserMinus}
          status="INACTIVE"
          branches={counts.INACTIVE.branches}
          showBranches={canViewAll}
          selection={selection}
          onToggleBranch={onToggleBranch}
        />
        <BidderStatCard
          title="Banned Bidders"
          value={counts.BANNED.total}
          icon={Ban}
          status="BANNED"
          branches={counts.BANNED.branches}
          showBranches={canViewAll}
          selection={selection}
          onToggleBranch={onToggleBranch}
        />
      </div>

      <BiddersTable
        key={tableKey}
        bidders={bidders}
        initialColumnFilters={initialFilters}
      />
    </>
  );
}
