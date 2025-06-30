"use client";

import React from "react";
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns";

import { FullScreenCalendarDay } from "@/app/components/fullscreen-calendar/components/fullscreen-calendar-day";
import { FullScreenCalendarHeader } from "@/app/components/fullscreen-calendar/components/fullscreen-calendar-header";
import { FullScreenCalendarWeekDays } from "@/app/components/fullscreen-calendar/components/fullscreen-calendar-week-days";

// for routing purposes only

export function FullScreenCalendar({
  onDayClick,
}: {
  onDayClick: (a: Date) => void;
}) {
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentMonth, setCurrentMonth] = React.useState(
    format(today, "MMM-yyyy")
  );
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  });

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 });
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"));
  }

  return (
    <div className="flex flex-1 flex-col">
      <FullScreenCalendarHeader
        startOfMonth={firstDayCurrentMonth}
        endOfMonth={endOfMonth(firstDayCurrentMonth)}
        nextMonth={nextMonth}
        previousMonth={previousMonth}
        goToToday={goToToday}
      />
      <div className="lg:flex lg:flex-auto lg:flex-col 2xl:h-[800px]">
        <FullScreenCalendarWeekDays />
        <div className="flex text-xs leading-6 lg:flex-auto">
          <div className="hidden w-full border-x lg:grid lg:grid-cols-7 lg:grid-rows-5">
            {days.map((day, dayIdx) => (
              <FullScreenCalendarDay
                key={dayIdx}
                day={day}
                selectedDay={selectedDay}
                onDayClick={onDayClick}
                setSelectedDay={setSelectedDay}
                firstDayCurrentMonth={firstDayCurrentMonth}
                dayIndex={dayIdx}
              />
            ))}
          </div>

          <div className="isolate grid w-full grid-cols-7 grid-rows-5 border-x lg:hidden">
            {days.map((day, dayIdx) => (
              <FullScreenCalendarDay
                key={dayIdx}
                day={day}
                onDayClick={onDayClick}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                firstDayCurrentMonth={firstDayCurrentMonth}
                dayIndex={dayIdx}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
