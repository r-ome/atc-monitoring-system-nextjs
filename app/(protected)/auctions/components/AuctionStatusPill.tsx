import { cn } from "@/app/lib/utils";

type StatusKey =
  | "PAID"
  | "UNPAID"
  | "REFUNDED"
  | "CANCELLED"
  | "DISCREPANCY"
  | "PARTIAL"
  | "ADD ON"
  | "ADD_ON"
  | "PULL OUT"
  | "PULL_OUT"
  | "BOUGHT ITEM"
  | "ENCODED"
  | "ERROR";

interface AuctionStatusPillProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

const STYLES: Record<string, string> = {
  PAID: "bg-status-success/15 text-status-success",
  UNPAID: "bg-destructive/10 text-destructive",
  REFUNDED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-secondary text-muted-foreground",
  DISCREPANCY: "bg-status-warning/15 text-status-warning-foreground",
  PARTIAL: "bg-status-warning/15 text-status-warning-foreground",
  "ADD ON": "bg-accent text-accent-foreground",
  ADD_ON: "bg-accent text-accent-foreground",
  "PULL OUT": "bg-status-success/15 text-status-success",
  PULL_OUT: "bg-status-success/15 text-status-success",
  "BOUGHT ITEM": "bg-status-success/15 text-status-success",
  ENCODED: "text-status-success",
  ERROR: "bg-destructive/10 text-destructive",
};

export function AuctionStatusPill({
  status,
  size = "md",
  className,
}: AuctionStatusPillProps) {
  const key = status.toUpperCase() as StatusKey;
  const colors = STYLES[key] ?? "bg-secondary text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded font-semibold uppercase",
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px]"
          : "px-2 py-0.5 text-[10.5px]",
        colors,
        className,
      )}
      style={{ letterSpacing: "0.04em" }}
    >
      {status}
    </span>
  );
}
