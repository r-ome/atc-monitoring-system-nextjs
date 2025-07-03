"use client";

import React from "react";
import { getDay, isEqual, isSameMonth, isToday } from "date-fns";
import { cn } from "@/app/lib/utils";
import { formatDate } from "@/app/lib/utils";

interface FullscreenCalendarDayProps {
  day: Date;
  selectedDay: Date;
  setSelectedDay: React.Dispatch<React.SetStateAction<Date>>;
  firstDayCurrentMonth: Date;
  dayIndex: number;
  onDayClick: (a: Date) => void;
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
];

export function FullScreenCalendarDay({
  day,
  selectedDay,
  setSelectedDay,
  onDayClick,
  firstDayCurrentMonth,
  dayIndex,
}: FullscreenCalendarDayProps) {
  return (
    <div
      key={dayIndex}
      onClick={() => {
        setSelectedDay(day);
        onDayClick(day);
      }}
      className={cn(
        "cursor-pointer",
        dayIndex === 0 && colStartClasses[getDay(day)],
        !isEqual(day, selectedDay) &&
          !isToday(day) &&
          !isSameMonth(day, firstDayCurrentMonth) &&
          "bg-accent/50 text-muted-foreground",
        "relative flex flex-col border-b border-r hover:bg-muted focus:z-10",
        !isEqual(day, selectedDay) && "hover:bg-accent/75"
      )}
    >
      <header className="flex items-center justify-between p-2.5">
        <button
          type="button"
          className={cn(
            isEqual(day, selectedDay) && "text-primary-foreground",
            !isEqual(day, selectedDay) &&
              !isToday(day) &&
              isSameMonth(day, firstDayCurrentMonth) &&
              "text-foreground",
            !isEqual(day, selectedDay) &&
              !isToday(day) &&
              !isSameMonth(day, firstDayCurrentMonth) &&
              "text-muted-foreground",
            isEqual(day, selectedDay) &&
              isToday(day) &&
              "border-none bg-primary",
            isEqual(day, selectedDay) && !isToday(day) && "bg-foreground",
            (isEqual(day, selectedDay) || isToday(day)) && "font-semibold",
            "flex h-7 w-7 items-center justify-center rounded-full text-xs hover:border"
          )}
        >
          <time dateTime={formatDate(day, "yyyy-MM-dd")}>
            {formatDate(day, "d")}
          </time>
        </button>
      </header>
      <div className="flex-1 p-2.5"></div>
    </div>
  );
}
