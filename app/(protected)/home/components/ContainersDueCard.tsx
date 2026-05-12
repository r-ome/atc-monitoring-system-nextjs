"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, ArrowRight, AlertCircle } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { isPast, parseISO, isWithinInterval, addDays } from "date-fns";
import { getContainersDueDate } from "@/app/(protected)/home/actions";
import type { ContainerDueDate } from "src/entities/models/Container";

type DueStatus = "overdue" | "soon" | "ok";

function getDueStatus(container: ContainerDueDate): DueStatus {
  if (!container.due_date_iso) return "ok";
  const due = parseISO(container.due_date_iso);
  const now = new Date();
  if (isPast(due)) return "overdue";
  if (isWithinInterval(due, { start: now, end: addDays(now, 7) })) return "soon";
  return "ok";
}

function getDueLabel(container: ContainerDueDate): string {
  if (!container.due_date_iso) return "—";
  const due = parseISO(container.due_date_iso);
  const now = new Date();
  if (isPast(due)) {
    const days = Math.round((now.getTime() - due.getTime()) / 86400000);
    return `Overdue ${days}d`;
  }
  const days = Math.round((due.getTime() - now.getTime()) / 86400000);
  if (days === 0) return "Due today";
  return `In ${days}d`;
}

const STATUS_STYLES: Record<DueStatus, string> = {
  overdue: "bg-destructive/10 text-destructive",
  soon: "bg-status-warning/10 text-status-warning",
  ok: "bg-status-success/10 text-status-success",
};

export function ContainersDueCard() {
  const router = useRouter();
  const [containers, setContainers] = useState<ContainerDueDate[]>([]);

  useEffect(() => {
    getContainersDueDate().then((res) => {
      if (res.ok) setContainers(res.value);
    });
  }, []);

  const sorted = [...containers].sort((a, b) => {
    const sa = getDueStatus(a);
    const sb = getDueStatus(b);
    const order = { overdue: 0, soon: 1, ok: 2 };
    return order[sa] - order[sb];
  });

  const overdueCount = sorted.filter((c) => getDueStatus(c) === "overdue").length;

  return (
    <Card className="flex flex-col p-3.5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Container size={14} className="text-muted-foreground" />
        <span className="text-[13.5px] font-semibold">Containers Due</span>
        {overdueCount > 0 && (
          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive">
            {overdueCount} overdue
          </span>
        )}
        <span className="ml-auto text-[11px] text-muted-foreground">
          {containers.length} this month
        </span>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1.5">
        {sorted.slice(0, 7).map((c) => {
          const status = getDueStatus(c);
          return (
            <div
              key={c.container_id}
              className="flex cursor-pointer items-center gap-2 rounded-md bg-secondary px-2.5 py-2 hover:bg-secondary/70"
              onClick={() => router.push(`/containers/${c.barcode}`)}
            >
              <span className="font-mono min-w-[56px] text-[12.5px] font-semibold">
                {c.barcode}
              </span>
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-muted-foreground">
                {c.container_number || c.bill_of_lading_number || "—"}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[status]}`}
              >
                {getDueLabel(c)}
              </span>
            </div>
          );
        })}
        {containers.length === 0 && (
          <p className="py-4 text-center text-[13px] text-muted-foreground">
            No containers due this month
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={() => router.push("/containers")}
          className="flex items-center gap-1 text-[12px] font-medium text-primary"
        >
          View all containers <ArrowRight size={12} />
        </button>
      </div>
    </Card>
  );
}
