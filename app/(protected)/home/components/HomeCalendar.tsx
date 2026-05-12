"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { getHomeCalendarEvents } from "@/app/(protected)/home/actions";
import {
  HomeCalendarEvent,
  HomeCalendarEventType,
} from "src/entities/models/Statistics";
import { cn } from "@/app/lib/utils";

const stripEmoji = (str: string) =>
  str.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "").trim();

const EVENT_STYLES: Record<HomeCalendarEventType, { pill: string; dot: string; label: string }> = {
  AUCTION:         { pill: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",       dot: "bg-blue-500",   label: "Auctions" },
  CONTAINER_DUE:   { pill: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",   dot: "bg-green-500",  label: "Containers Due" },
  BIDDER_BIRTHDAY: { pill: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300", dot: "bg-yellow-500", label: "Bidder Birthdays" },
};

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}

export function HomeCalendar() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<HomeCalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<HomeCalendarEvent | null>(null);

  useEffect(() => {
    getHomeCalendarEvents().then((res) => {
      if (res.ok) setEvents(res.value);
    });
  }, []);

  // Build calendar grid cells
  const cells = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Group events by date string "yyyy-MM-dd"
  const eventsByDate = useMemo(() => {
    const map: Record<string, HomeCalendarEvent[]> = {};
    for (const event of events) {
      const key = event.start.slice(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(event);
    }
    return map;
  }, [events]);

  const actionLabel =
    selectedEvent?.event_type === "AUCTION"
      ? "Go to Auction"
      : selectedEvent?.event_type === "CONTAINER_DUE"
        ? "View Container"
        : "View Bidder";

  const handleOpenRoute = () => {
    if (!selectedEvent) return;
    router.push(selectedEvent.details.route_path);
    setSelectedEvent(null);
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Top header row: title + legend + filter */}
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2 text-[15px] font-semibold">
            Events Calendar
          </div>
          <div className="flex items-center gap-4">
            {/* Legend */}
            <div className="hidden items-center gap-4 text-[12px] text-muted-foreground sm:flex">
              {Object.values(EVENT_STYLES).map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <span className={cn("inline-block h-2 w-2 rounded-full", s.dot)} />
                  {s.label}
                </span>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[12px]">
              Filter
            </Button>
            <div className="flex overflow-hidden rounded-md border text-[12px]">
              <button className="bg-foreground px-3 py-1 font-medium text-background">Calendar</button>
              <button className="px-3 py-1 text-muted-foreground hover:bg-muted">List</button>
            </div>
          </div>
        </div>

        {/* Navigation row: arrows + today + month title */}
        <div className="flex items-center px-5 py-1">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft size={14} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight size={14} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[12px]"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
          </div>
          <span className="flex-1 text-center text-[16px] font-semibold tracking-tight">
            {format(currentMonth, "MMMM yyyy")}
          </span>
          {/* Spacer to balance the left controls */}
          <div className="w-[108px]" />
        </div>

        {/* Day-of-week labels + calendar grid wrapped together to avoid Card's gap-6 */}
        <div>
        <div className="grid grid-cols-7 border-y bg-muted/40">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
            <div
              key={d}
              className={cn(
                "border-r px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                i === 6 && "border-r-0",
              )}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            const key = format(day, "yyyy-MM-dd");
            const dayEvents = eventsByDate[key] ?? [];
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const today = isToday(day);

            return (
              <div
                key={key}
                className={cn(
                  "min-h-[90px] border-b border-r p-1.5",
                  !isCurrentMonth && "bg-muted/40",
                  today && "bg-blue-50 dark:bg-blue-950/30",
                  (i + 1) % 7 === 0 && "border-r-0",
                )}
              >
                {/* Day number */}
                <div className="mb-1 flex justify-end">
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded text-[12px] font-medium",
                      !isCurrentMonth ? "text-muted-foreground" : "text-foreground",
                    )}
                    style={today ? { background: "var(--primary)", color: "var(--primary-foreground)" } : undefined}
                  >
                    {format(day, "d")}
                  </span>
                </div>

                {/* Event pills */}
                <div className="flex flex-col gap-0.5">
                  {dayEvents.slice(0, 3).map((event) => {
                    const style = EVENT_STYLES[event.event_type];
                    return (
                      <button
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className={cn(
                          "flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[11px] font-medium leading-tight transition-opacity hover:opacity-80",
                          style.pill,
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", style.dot)} />
                        <span className="truncate">{stripEmoji(event.title)}</span>
                      </button>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <span className="px-1 text-[10.5px] text-muted-foreground">
                      +{dayEvents.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </Card>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {selectedEvent.event_type === "AUCTION"
                    ? "Auction details"
                    : selectedEvent.event_type === "CONTAINER_DUE"
                      ? "Container due date details"
                      : "Bidder birthday details"}
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3">
                {selectedEvent.event_type === "AUCTION" && (
                  <>
                    <DetailRow label="Auction Date" value={selectedEvent.details.auction_date} />
                    <DetailRow label="Registered Bidders" value={selectedEvent.details.total_registered_bidders} />
                    <DetailRow label="Unpaid Bidders" value={selectedEvent.details.total_bidders_with_balance} />
                    <DetailRow label="Total Items" value={selectedEvent.details.total_items} />
                    <DetailRow label="Cancelled" value={selectedEvent.details.total_cancelled_items} />
                    <DetailRow label="Refunded" value={selectedEvent.details.total_refunded_items} />
                    <DetailRow label="Containers" value={selectedEvent.details.container_barcodes || "N/A"} />
                  </>
                )}
                {selectedEvent.event_type === "CONTAINER_DUE" && (
                  <>
                    <DetailRow label="Barcode" value={selectedEvent.details.barcode} />
                    <DetailRow label="Due Date" value={selectedEvent.details.due_date} />
                    <DetailRow label="Arrival Date" value={selectedEvent.details.arrival_date} />
                    <DetailRow label="Container No." value={selectedEvent.details.container_number || "N/A"} />
                    <DetailRow label="BL Number" value={selectedEvent.details.bill_of_lading_number || "N/A"} />
                    <DetailRow label="Branch" value={selectedEvent.details.branch_name} />
                  </>
                )}
                {selectedEvent.event_type === "BIDDER_BIRTHDAY" && (
                  <>
                    <DetailRow label="Bidder Number" value={selectedEvent.details.bidder_number} />
                    <DetailRow label="Full Name" value={selectedEvent.details.full_name} />
                    <DetailRow label="Birthdate" value={selectedEvent.details.birthdate} />
                    <DetailRow label="Age" value={`${selectedEvent.details.age} y/o`} />
                    <DetailRow label="Last Auction" value={selectedEvent.details.last_auction_date} />
                  </>
                )}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleOpenRoute}>
                  {actionLabel}
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
