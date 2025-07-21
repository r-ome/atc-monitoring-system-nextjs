import React, { useState } from "react";
import { DayPicker, CaptionProps } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react"; // adjust if needed
import { cn } from "@/app/lib/utils"; // adjust path
import { buttonVariants } from "@/app/components/ui/button"; // adjust path

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const [month, setMonth] = useState(new Date());

  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1940 + 1 },
    (_, i) => 1940 + i
  );
  const months = Array.from({ length: 12 }, (_, i) =>
    new Date(0, i).toLocaleString("default", { month: "long" })
  );

  const CustomCaption = ({ displayMonth }: CaptionProps) => {
    const handleChange = (type: "month" | "year", value: number) => {
      const newDate = new Date(displayMonth);
      if (type === "month") newDate.setMonth(value);
      else newDate.setFullYear(value);
      setMonth(newDate);
    };

    const prevMonth = () => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(displayMonth.getMonth() - 1);
      setMonth(newDate);
    };

    const nextMonth = () => {
      const newDate = new Date(displayMonth);
      newDate.setMonth(displayMonth.getMonth() + 1);
      setMonth(newDate);
    };

    return (
      <div className="flex flex-col items-center gap-2">
        <div className="flex justify-between items-center w-full px-4">
          <button type="button" className="pr-3" onClick={prevMonth}>
            <ChevronLeft className="size-4 cursor-pointer" />
          </button>
          <div className="flex items-center justify-center gap-2">
            <select
              value={displayMonth.getMonth()}
              onChange={(e) => handleChange("month", Number(e.target.value))}
              className="border px-2 py-1 rounded text-sm"
            >
              {months.map((label, i) => (
                <option key={i} value={i}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={displayMonth.getFullYear()}
              onChange={(e) => handleChange("year", Number(e.target.value))}
              className="border px-2 py-1 rounded text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="pl-3" onClick={nextMonth}>
            <ChevronRight className="size-4 cursor-pointer" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <DayPicker
      month={month}
      onMonthChange={setMonth}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
      }}
      {...props}
    />
  );
}
