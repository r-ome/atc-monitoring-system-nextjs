"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDaysIcon,
  ContainerIcon,
  InboxIcon,
  Table2Icon,
} from "lucide-react";
import { format, isSameMonth, isToday, parseISO, startOfMonth } from "date-fns";
import { DataTable } from "@/app/components/data-table/data-table";
import { BranchBadge } from "@/app/components/admin";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/app/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { columns } from "./containers-due-date-columns";
import { ContainerDueDate } from "src/entities/models/Container";
import { getContainersDueDate } from "@/app/(protected)/home/actions";

const VIEW_VALUES = ["table", "calendar"] as const;

type ViewValue = (typeof VIEW_VALUES)[number];

const getDueDate = (container: ContainerDueDate) =>
  container.due_date_iso ? parseISO(container.due_date_iso) : null;

const getInitialSelectedDate = (items: ContainerDueDate[]) => {
  const todayContainer = items.find((container) => {
    const dueDate = getDueDate(container);
    return dueDate ? isToday(dueDate) : false;
  });

  if (todayContainer?.due_date_iso) {
    return parseISO(todayContainer.due_date_iso);
  }

  const firstDueContainer = items.find((container) => container.due_date_iso);

  return firstDueContainer?.due_date_iso
    ? parseISO(firstDueContainer.due_date_iso)
    : undefined;
};

export const ContainersDueDateTable = () => {
  const router = useRouter();
  const [containers, setContainers] = useState<ContainerDueDate[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<ViewValue>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [month, setMonth] = useState<Date>(startOfMonth(new Date()));

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getContainersDueDate();
      if (!result.ok) {
        setLoadError(result.error.message);
        return;
      }

      setContainers(result.value);

      const initialSelectedDate = getInitialSelectedDate(result.value);

      if (initialSelectedDate) {
        setSelectedDate(initialSelectedDate);
        setMonth(startOfMonth(initialSelectedDate));
      }
    };

    fetchInitialData();
  }, []);

  const containersByDueDate = containers.reduce<
    Record<string, ContainerDueDate[]>
  >((acc, container) => {
    if (!container.due_date_iso) return acc;

    if (!acc[container.due_date_iso]) {
      acc[container.due_date_iso] = [];
    }

    acc[container.due_date_iso].push(container);
    return acc;
  }, {});

  const dueDates = Object.keys(containersByDueDate).map((dueDate) =>
    parseISO(dueDate),
  );
  const selectedDateKey = selectedDate
    ? format(selectedDate, "yyyy-MM-dd")
    : null;
  const selectedDateContainers = selectedDateKey
    ? containersByDueDate[selectedDateKey] ?? []
    : [];
  const hasContainersInVisibleMonth = dueDates.some((dueDate) =>
    isSameMonth(dueDate, month),
  );

  const handleMonthChange = (nextMonth: Date) => {
    setMonth(nextMonth);

    const firstContainerInMonth = containers.find((container) => {
      const dueDate = getDueDate(container);
      return dueDate ? isSameMonth(dueDate, nextMonth) : false;
    });

    if (!selectedDate || !isSameMonth(selectedDate, nextMonth)) {
      setSelectedDate(
        firstContainerInMonth?.due_date_iso
          ? parseISO(firstContainerInMonth.due_date_iso)
          : undefined,
      );
    }
  };

  const handleViewChange = (value: string) => {
    if (value === "table" || value === "calendar") {
      setView(value);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);

    if (!date) {
      setDialogOpen(false);
      return;
    }

    const dateKey = format(date, "yyyy-MM-dd");
    setDialogOpen((containersByDueDate[dateKey] ?? []).length > 0);
  };

  return (
    <Tabs value={view} onValueChange={handleViewChange} className="gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ContainerIcon />
          <div className="text-xl font-bold">Containers Due Date</div>
        </div>

        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="table" className="flex-1 sm:flex-none">
            <Table2Icon />
            Table
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex-1 sm:flex-none">
            <CalendarDaysIcon />
            Calendar
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="table">
        <DataTable
          onRowClick={(container) =>
            router.push(`/containers/${container.barcode}`)
          }
          columns={columns}
          data={containers}
        />
      </TabsContent>

      <TabsContent value="calendar">
        <div className="rounded-md border p-4">
          {loadError ? (
            <Empty className="py-10">
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>Unable to load containers</EmptyTitle>
                <EmptyDescription>{loadError}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : containers.length === 0 ? (
            <Empty className="py-10">
              <EmptyMedia variant="icon">
                <InboxIcon />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No due containers</EmptyTitle>
                <EmptyDescription>
                  There are no upcoming containers with a due date.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <>
              <div className="overflow-auto">
                <Calendar
                  mode="single"
                  month={month}
                  onMonthChange={handleMonthChange}
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  modifiers={{ hasDueDate: dueDates }}
                  modifiersClassNames={{
                    hasDueDate:
                      "bg-amber-100 font-semibold text-amber-950 dark:bg-amber-500/20 dark:text-amber-100",
                  }}
                  className="w-full"
                  classNames={{
                    months: "w-full",
                    month: "w-full",
                    table: "mt-3 w-full",
                    head_row: "grid grid-cols-7",
                    row: "mt-2 grid grid-cols-7",
                    head_cell: "w-full text-center",
                    cell: "w-full",
                    day: "h-10 w-full cursor-pointer",
                    day_selected: "",
                    day_today:
                      "bg-slate-300 text-slate-950 dark:bg-slate-700 dark:text-slate-50",
                  }}
                />
              </div>

              {!hasContainersInVisibleMonth ? (
                <Empty className="border-0 px-0 py-6">
                  <EmptyMedia variant="icon">
                    <CalendarDaysIcon />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>No due containers this month</EmptyTitle>
                    <EmptyDescription>
                      Move to another month to see upcoming due containers.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : null}

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
                  <DialogHeader className="border-b px-6 py-4 pr-12">
                    <DialogTitle>
                      {selectedDate
                        ? format(selectedDate, "MMMM dd, yyyy")
                        : "Containers Due Date"}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedDateContainers.length} container
                      {selectedDateContainers.length > 1 ? "s" : ""} due on this
                      date.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="flex max-h-[calc(85vh-88px)] flex-col gap-2 overflow-y-auto p-6">
                    {selectedDateContainers.map((container) => (
                      <Button
                        key={container.container_id}
                        variant="outline"
                        className="h-auto justify-between py-3 text-left"
                        onClick={() =>
                          router.push(`/containers/${container.barcode}`)
                        }
                      >
                        <div className="flex flex-col items-start">
                          <div className="font-semibold">
                            {container.barcode}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Arrival: {container.arrival_date}
                          </div>
                          {container.container_number ? (
                            <div className="text-muted-foreground text-xs">
                              Container: {container.container_number}
                            </div>
                          ) : null}
                          {container.bill_of_lading_number ? (
                            <div className="text-muted-foreground text-xs">
                              BL: {container.bill_of_lading_number}
                            </div>
                          ) : null}
                        </div>

                        <BranchBadge branch={container.branch.name} />
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};
