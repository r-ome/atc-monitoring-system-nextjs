"use client";

import React from "react";
import { format, startOfToday } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/app/components/ui/button";

interface FullScreenCalendarHeaderProps {
  startOfMonth: Date;
  endOfMonth: Date;
  nextMonth: () => void;
  goToToday: () => void;
  previousMonth: () => void;
}

export function FullScreenCalendarHeader({
  nextMonth,
  goToToday,
  previousMonth,
  startOfMonth,
  endOfMonth,
}: FullScreenCalendarHeaderProps) {
  const today = startOfToday();

  return (
    <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
      <div className="flex flex-auto">
        <div className="flex items-center gap-4">
          <div className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
            <h1 className="p-1 text-xs uppercase text-muted-foreground">
              {format(today, "MMM")}
            </h1>
            <div className="flex w-full items-center justify-center rounded-lg border bg-background p-0.5 text-lg font-bold">
              <span>{format(today, "d")}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground">
              {format(startOfMonth, "MMMM, yyyy")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {format(startOfMonth, "MMM d, yyyy")} -{" "}
              {format(endOfMonth, "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
        <div className="inline-flex w-full -space-x-px rounded-lg shadow-sm shadow-black/5 md:w-auto rtl:space-x-reverse">
          <Button
            onClick={previousMonth}
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
            variant="outline"
            size="icon"
            aria-label="Navigate to previous month"
          >
            <ChevronLeftIcon size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
          <Button
            onClick={goToToday}
            className="w-full rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10 md:w-auto"
            variant="outline"
          >
            Today
          </Button>
          <Button
            onClick={nextMonth}
            className="rounded-none shadow-none first:rounded-s-lg last:rounded-e-lg focus-visible:z-10"
            variant="outline"
            size="icon"
            aria-label="Navigate to next month"
          >
            <ChevronRightIcon size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
