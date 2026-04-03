"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import {
  AlertCircle,
  CalendarDays,
  ExternalLink,
  Filter,
  InboxIcon,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/app/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { getHomeCalendarEvents } from "@/app/(protected)/home/actions";
import {
  HOME_CALENDAR_EVENT_TYPES,
  HomeCalendarEvent,
  HomeCalendarEventType,
} from "src/entities/models/Statistics";
import { cn } from "@/app/lib/utils";
import { BranchBadge } from "@/app/components/admin";

type CalendarLegendItem = {
  value: HomeCalendarEventType;
  label: string;
};

const LEGEND_ITEMS: CalendarLegendItem[] = [
  { value: "AUCTION", label: "Auctions" },
  {
    value: "CONTAINER_DUE",
    label: "Containers Due",
  },
  {
    value: "BIDDER_BIRTHDAY",
    label: "Bidder Birthdays",
  },
];

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-medium break-words">{value}</div>
    </div>
  );
}

export function HomeCalendar() {
  const router = useRouter();
  const [events, setEvents] = useState<HomeCalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<HomeCalendarEventType[]>(
    [...HOME_CALENDAR_EVENT_TYPES],
  );
  const [selectedEvent, setSelectedEvent] = useState<HomeCalendarEvent | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const result = await getHomeCalendarEvents();

      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setEvents(result.value);
    };

    fetchEvents();
  }, []);

  const eventMap = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );
  const filteredEvents = useMemo(
    () =>
      events.filter((event) => selectedTypes.includes(event.event_type)),
    [events, selectedTypes],
  );
  const legendColors = useMemo(
    () =>
      events.reduce(
        (accumulator, event) => {
          accumulator[event.event_type] = event.backgroundColor;
          return accumulator;
        },
        {} as Partial<Record<HomeCalendarEventType, string>>,
      ),
    [events],
  );

  useEffect(() => {
    if (selectedEvent && !selectedTypes.includes(selectedEvent.event_type)) {
      setSelectedEvent(null);
      setDialogOpen(false);
    }
  }, [selectedEvent, selectedTypes]);

  const handleEventClick = ({ event }: EventClickArg) => {
    const clickedEvent = eventMap.get(event.id);

    if (!clickedEvent) {
      return;
    }

    setSelectedEvent(clickedEvent);
    setDialogOpen(true);
  };

  const handleOpenRoute = () => {
    if (!selectedEvent) {
      return;
    }

    router.push(selectedEvent.details.route_path);
    setDialogOpen(false);
  };
  const toggleEventType = (eventType: HomeCalendarEventType, checked: boolean) => {
    setSelectedTypes((current) => {
      if (checked) {
        return current.includes(eventType) ? current : [...current, eventType];
      }

      if (current.length === 1) {
        return current;
      }

      return current.filter((value) => value !== eventType);
    });
  };

  const actionLabel = selectedEvent
    ? selectedEvent.event_type === "AUCTION"
      ? "Go to Auction"
      : selectedEvent.event_type === "CONTAINER_DUE"
        ? "View Container"
        : "View Bidder"
    : "Open Record";

  const renderEventContent = (eventContent: EventContentArg) => {
    return (
      <div className="flex items-center overflow-hidden">
        <span className="truncate">{eventContent.event.title}</span>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            <CardTitle>Events Calendar</CardTitle>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              {LEGEND_ITEMS.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className={cn("size-3 rounded-full")}
                    style={{
                      backgroundColor:
                        legendColors[item.value] ?? "var(--muted-foreground)",
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="size-4" />
                  Filter Events
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Show Event Types</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {LEGEND_ITEMS.map((item) => (
                  <DropdownMenuCheckboxItem
                    key={item.value}
                    checked={selectedTypes.includes(item.value)}
                    onCheckedChange={(checked) =>
                      toggleEventType(item.value, checked === true)
                    }
                  >
                    {item.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertTitle>Failed to load calendar events</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : events.length === 0 ? (
            <Empty className="py-10">
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No calendar events</EmptyTitle>
                <EmptyDescription>
                  There are no auctions, container due dates, or bidder birthdays
                  to show right now.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : filteredEvents.length === 0 ? (
            <Empty className="py-10">
              <EmptyMedia variant="icon">
                <Filter />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No events match the current filter</EmptyTitle>
                <EmptyDescription>
                  Turn on at least one event type to show items on the calendar.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="home-calendar">
              <FullCalendar
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height="auto"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "",
                }}
                buttonText={{ today: "Today" }}
                events={filteredEvents}
                eventClick={handleEventClick}
                eventContent={renderEventContent}
                dayMaxEvents={3}
                fixedWeekCount={false}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedEvent ? (
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
                {selectedEvent.event_type === "AUCTION" ? (
                  <>
                    <DetailRow
                      label="Auction Date"
                      value={selectedEvent.details.auction_date}
                    />
                    <DetailRow
                      label="Registered Bidders"
                      value={selectedEvent.details.total_registered_bidders}
                    />
                    <DetailRow
                      label="Unpaid Bidders"
                      value={selectedEvent.details.total_bidders_with_balance}
                    />
                    <DetailRow
                      label="Total Items"
                      value={selectedEvent.details.total_items}
                    />
                    <DetailRow
                      label="Cancelled"
                      value={selectedEvent.details.total_cancelled_items}
                    />
                    <DetailRow
                      label="Refunded"
                      value={selectedEvent.details.total_refunded_items}
                    />
                    <DetailRow
                      label="Containers"
                      value={selectedEvent.details.container_barcodes || "N/A"}
                    />
                  </>
                ) : null}

                {selectedEvent.event_type === "CONTAINER_DUE" ? (
                  <>
                    <DetailRow label="Barcode" value={selectedEvent.details.barcode} />
                    <DetailRow label="Due Date" value={selectedEvent.details.due_date} />
                    <DetailRow
                      label="Arrival Date"
                      value={selectedEvent.details.arrival_date}
                    />
                    <DetailRow
                      label="Container No."
                      value={selectedEvent.details.container_number || "N/A"}
                    />
                    <DetailRow
                      label="BL Number"
                      value={selectedEvent.details.bill_of_lading_number || "N/A"}
                    />
                    <DetailRow
                      label="Branch"
                      value={<BranchBadge branch={selectedEvent.details.branch_name} />}
                    />
                  </>
                ) : null}

                {selectedEvent.event_type === "BIDDER_BIRTHDAY" ? (
                  <>
                    <DetailRow
                      label="Bidder Number"
                      value={selectedEvent.details.bidder_number}
                    />
                    <DetailRow
                      label="Full Name"
                      value={selectedEvent.details.full_name}
                    />
                    <DetailRow
                      label="Birthdate"
                      value={selectedEvent.details.birthdate}
                    />
                    <DetailRow
                      label="Age"
                      value={`${selectedEvent.details.age} y/o`}
                    />
                    <DetailRow
                      label="Last Auction"
                      value={selectedEvent.details.last_auction_date}
                    />
                  </>
                ) : null}
              </div>

              <div className="flex justify-end">
                <Button onClick={handleOpenRoute}>
                  {actionLabel}
                  <ExternalLink className="size-4" />
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
