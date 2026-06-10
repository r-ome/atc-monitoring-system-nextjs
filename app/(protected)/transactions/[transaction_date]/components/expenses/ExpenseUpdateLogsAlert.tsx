"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { ActivityLog } from "src/entities/models/ActivityLog";
import {
  EXPENSE_PURPOSE,
  type ExpensePurpose,
} from "src/entities/models/Expense";
import { ExpenseTypeBadge } from "@/app/components/admin";
import { Button } from "@/app/components/ui/button";
import { Alert } from "@/app/components/ui/alert";
import { cn, formatDate } from "@/app/lib/utils";
import {
  formatExpenseChangeValue,
  formatPlainExpenseDescription,
  parseExpenseUpdateActivityDescription,
} from "@/app/lib/activity-log-description";

interface ExpenseUpdateLogsAlertProps {
  expenseUpdateLogs: ActivityLog[];
}

// "Updated expense (Electricity) — …" → "Electricity"; falls back to the full
// "Updated expense (…)" title when no parenthetical name is present.
function getExpenseUpdateTitle(description: string): string | null {
  const parsed = parseExpenseUpdateActivityDescription(description);
  if (!parsed) {
    return null;
  }
  const nameMatch = parsed.title.match(/\((.+)\)/);
  return nameMatch ? nameMatch[1].trim() : parsed.title;
}

const EXPENSE_PURPOSES: readonly string[] = EXPENSE_PURPOSE;

function isExpensePurpose(value: string): value is ExpensePurpose {
  return EXPENSE_PURPOSES.includes(value.trim());
}

function parseAmount(value: string): number {
  return Number(value.replace(/[^0-9.-]/g, ""));
}

// Renders a single value: the matching expense-type badge when the field is a
// known purpose, otherwise the formatted text. Used for unchanged rows so the
// styling stays uniform with the expenses table.
function ChangeValue({ field, value }: { field: string; value: string }) {
  const trimmed = value.trim();

  if (field === "Type" && isExpensePurpose(trimmed)) {
    return <ExpenseTypeBadge expenseType={trimmed} size="sm" />;
  }

  return (
    <span className="break-words text-yellow-900/90">
      {formatExpenseChangeValue(field, value) || "—"}
    </span>
  );
}

// Amount changes get a directional cue: green up-arrow when the value rose,
// red down-arrow when it fell (purely directional, no cost semantics).
function AmountChange({ before, after }: { before: string; after: string }) {
  const beforeNum = parseAmount(before);
  const afterNum = parseAmount(after);
  const direction =
    Number.isFinite(beforeNum) &&
    Number.isFinite(afterNum) &&
    beforeNum !== afterNum
      ? afterNum > beforeNum
        ? "up"
        : "down"
      : null;

  const DirectionIcon =
    direction === "up" ? ArrowUp : direction === "down" ? ArrowDown : ArrowRight;
  const afterColor =
    direction === "up"
      ? "text-green-700"
      : direction === "down"
        ? "text-red-600"
        : "text-yellow-950";
  const iconColor =
    direction === "up"
      ? "text-green-600"
      : direction === "down"
        ? "text-red-500"
        : "text-yellow-600";

  return (
    <>
      <span className="break-words text-yellow-700/80 line-through decoration-yellow-700/50">
        {formatExpenseChangeValue("Amount", before) || "—"}
      </span>
      <DirectionIcon className={cn("size-3.5 shrink-0", iconColor)} />
      <span className={cn("font-medium break-words", afterColor)}>
        {formatExpenseChangeValue("Amount", after) || "—"}
      </span>
    </>
  );
}

function ChangeDiff({
  field,
  before,
  after,
}: {
  field: string;
  before: string;
  after: string;
}) {
  const formattedBefore = formatExpenseChangeValue(field, before);
  const formattedAfter = formatExpenseChangeValue(field, after);
  // The controller logs every field on an update, so a row may carry identical
  // before/after values — only treat it as a change (and apply the
  // strikethrough/arrow) when the values actually differ.
  const hasChange = after.trim().length > 0 && formattedBefore !== formattedAfter;

  let content: ReactNode;
  if (!hasChange) {
    content = <ChangeValue field={field} value={before} />;
  } else if (field === "Amount") {
    content = <AmountChange before={before} after={after} />;
  } else {
    const beforeTrimmed = before.trim();
    const afterTrimmed = after.trim();
    const beforeIsBadge = field === "Type" && isExpensePurpose(beforeTrimmed);
    const afterIsBadge = field === "Type" && isExpensePurpose(afterTrimmed);

    content = (
      <>
        {beforeIsBadge ? (
          <span className="opacity-60">
            <ExpenseTypeBadge expenseType={beforeTrimmed} size="sm" />
          </span>
        ) : (
          <span className="break-words text-yellow-700/80 line-through decoration-yellow-700/50">
            {formattedBefore || "—"}
          </span>
        )}
        <ArrowRight className="size-3.5 shrink-0 text-yellow-600" />
        {afterIsBadge ? (
          <ExpenseTypeBadge expenseType={afterTrimmed} size="sm" />
        ) : (
          <span className="rounded bg-yellow-200/60 px-1.5 py-0.5 font-medium break-words text-yellow-950">
            {formattedAfter || "—"}
          </span>
        )}
      </>
    );
  }

  return (
    <div className="grid grid-cols-[8rem_1fr] gap-x-3 gap-y-1 py-1.5 sm:grid-cols-[10rem_1fr]">
      <span className="text-sm font-medium text-yellow-950">{field}</span>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {content}
      </div>
    </div>
  );
}

function ActivityChangeTable({ description }: { description: string }) {
  const parsed = parseExpenseUpdateActivityDescription(description);

  if (!parsed) {
    return (
      <p className="text-sm text-yellow-900/90">
        {formatPlainExpenseDescription(description)}
      </p>
    );
  }

  return (
    <div className="divide-y divide-yellow-100">
      {parsed.changes.map((change, index) => (
        <ChangeDiff
          key={`${change.field}-${index}`}
          field={change.field}
          before={change.before}
          after={change.after}
        />
      ))}
    </div>
  );
}

export const ExpenseUpdateLogsAlert = ({
  expenseUpdateLogs,
}: ExpenseUpdateLogsAlertProps) => {
  const [showMore, setShowMore] = useState(false);
  const hasLogs = expenseUpdateLogs.length > 0;

  if (!hasLogs) {
    return null;
  }

  return (
    <Alert className="border-yellow-500 bg-yellow-50 text-yellow-950 [&>svg]:text-yellow-700">
      <AlertTriangle />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Expense modifications</div>
            <p className="text-sm text-yellow-800">
              {expenseUpdateLogs.length.toLocaleString()}{" "}
              {expenseUpdateLogs.length === 1 ? "update" : "updates"} recorded
              for the expenses listed below.
            </p>
          </div>
          {hasLogs ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-yellow-300 bg-white/70 text-yellow-950 hover:bg-yellow-100 hover:text-yellow-950"
              onClick={() => setShowMore((value) => !value)}
              aria-expanded={showMore}
            >
              {showMore ? (
                <>
                  <ChevronUp />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown />
                  Show more
                </>
              )}
            </Button>
          ) : null}
        </div>

        {showMore && hasLogs ? (
          <div className="max-h-80 space-y-3 overflow-auto border-t border-yellow-200 pt-3">
            {expenseUpdateLogs.map((log) => {
              const title = getExpenseUpdateTitle(log.description);

              return (
                <div
                  key={log.activity_log_id}
                  className="rounded-md border border-yellow-200 bg-white/70 p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="text-sm font-semibold text-yellow-950">
                      {title ?? "Expense update"}
                    </div>
                    <div className="text-xs text-yellow-700">
                      {formatDate(
                        new Date(log.created_at),
                        "MMM dd, yyyy hh:mm a",
                      )}
                    </div>
                  </div>
                  <div className="mt-0.5 text-xs text-yellow-700/80">
                    Edited by{" "}
                    <span className="font-medium text-yellow-900">
                      {log.username}
                    </span>
                  </div>
                  <div className="mt-2 border-t border-yellow-100 pt-2">
                    <ActivityChangeTable description={log.description} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </Alert>
  );
};
