"use client";

import { useMemo } from "react";
import { Badge } from "@/app/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import type { WorkedDate, WorkedDayType } from "src/entities/models/PayrollEntry";

interface Props {
  periodStart: string; // YYYY-MM-DD
  periodEnd: string;
  auctionDates: string[]; // YYYY-MM-DD, prefilled
  value: WorkedDate[];
  onChange: (next: WorkedDate[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

const TYPE_ORDER: (WorkedDayType | "OFF")[] = ["OFF", "REGULAR", "AUCTION", "LEAVE", "HOLIDAY"];
const TYPE_LABEL: Record<WorkedDayType | "OFF", string> = {
  OFF: "Off",
  REGULAR: "Reg",
  AUCTION: "Auc",
  LEAVE: "Lve",
  HOLIDAY: "Hol",
};
const TYPE_CLASS: Record<WorkedDayType | "OFF", string> = {
  OFF: "bg-muted text-muted-foreground hover:bg-muted/70",
  REGULAR: "bg-emerald-100 text-emerald-900 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-100",
  AUCTION: "bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100",
  LEAVE: "bg-sky-100 text-sky-900 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-100",
  HOLIDAY: "bg-purple-100 text-purple-900 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100",
};

function enumerate(start: string, end: string): string[] {
  const out: string[] = [];
  const s = new Date(start + "T00:00:00Z");
  const e = new Date(end + "T00:00:00Z");
  const cur = new Date(s);
  while (cur.getTime() <= e.getTime()) {
    out.push(cur.toISOString().split("T")[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const WorkedDatesPicker: React.FC<Props> = ({
  periodStart,
  periodEnd,
  auctionDates,
  value,
  onChange,
  disabled = false,
  compact = false,
}) => {
  const days = useMemo(() => enumerate(periodStart, periodEnd), [periodStart, periodEnd]);
  const auctionSet = useMemo(() => new Set(auctionDates), [auctionDates]);
  const map = useMemo(() => {
    const m = new Map<string, WorkedDayType>();
    for (const v of value) m.set(v.date, v.type);
    return m;
  }, [value]);

  const cycle = (iso: string) => {
    const current = map.get(iso);
    let next: WorkedDayType | "OFF";
    if (auctionSet.has(iso)) {
      // Auction-day cycling: OFF -> AUCTION -> LEAVE -> HOLIDAY -> OFF
      switch (current) {
        case undefined:
          next = "AUCTION";
          break;
        case "AUCTION":
          next = "LEAVE";
          break;
        case "LEAVE":
          next = "HOLIDAY";
          break;
        default:
          next = "OFF";
      }
    } else {
      switch (current) {
        case undefined:
          next = "REGULAR";
          break;
        case "REGULAR":
          next = "LEAVE";
          break;
        case "LEAVE":
          next = "HOLIDAY";
          break;
        default:
          next = "OFF";
      }
    }
    const filtered = value.filter((d) => d.date !== iso);
    if (next !== "OFF") filtered.push({ date: iso, type: next });
    filtered.sort((a, b) => a.date.localeCompare(b.date));
    onChange(filtered);
  };

  const counts: Record<WorkedDayType, number> = {
    REGULAR: 0,
    AUCTION: 0,
    LEAVE: 0,
    HOLIDAY: 0,
  };
  for (const v of value) counts[v.type]++;

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <div className="flex flex-wrap gap-1 text-[11px]">
        {(TYPE_ORDER.filter((t) => t !== "OFF") as WorkedDayType[]).map((t) => (
          <Badge key={t} variant="outline" className={`${TYPE_CLASS[t]} border-0`}>
            {TYPE_LABEL[t]} {counts[t]}
          </Badge>
        ))}
      </div>
      <TooltipProvider delayDuration={150}>
        <div className="grid grid-cols-7 gap-0.5 text-[10px]">
          {DOW.map((d) => (
            <div key={d} className="text-center text-muted-foreground font-medium py-0.5">
              {d}
            </div>
          ))}
          {(() => {
            const first = new Date(days[0] + "T00:00:00Z");
            const offset = first.getUTCDay();
            return Array.from({ length: offset }).map((_, i) => (
              <div key={`pad-${i}`} className="" />
            ));
          })()}
          {days.map((iso) => {
            const type = map.get(iso);
            const isAuctionDay = auctionSet.has(iso);
            const cls = TYPE_CLASS[type ?? "OFF"];
            const dayNum = parseInt(iso.split("-")[2], 10);
            return (
              <Tooltip key={iso}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && cycle(iso)}
                    className={`relative rounded-sm py-1 text-center border ${cls} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"} ${isAuctionDay ? "ring-1 ring-amber-500" : "border-transparent"}`}
                  >
                    {dayNum}
                    {type && (
                      <span className="absolute right-0.5 top-0.5 text-[8px] font-semibold opacity-70">
                        {TYPE_LABEL[type][0]}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {iso}
                  {isAuctionDay ? " · auction day" : ""}
                  {type ? ` · ${TYPE_LABEL[type]}` : " · off"}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      {!disabled && (
        <p className="text-[10px] text-muted-foreground">
          Click a day to cycle: off → reg → leave → holiday. Auction days cycle off → auc → leave → holiday.
        </p>
      )}
    </div>
  );
};
