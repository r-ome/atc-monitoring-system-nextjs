"use client";

import React, { useEffect } from "react";
import { formatDate } from "@/app/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

interface DatePickerProps {
  id: string;
  name: string;
  date?: Date;
  required?: boolean;
  modal?: boolean;
  onChange: (date: Date | undefined) => void;
}

export function DatePicker({
  id,
  name,
  date,
  required = false,
  modal = true,
  onChange,
}: DatePickerProps) {
  const [stringDate, setStringDate] = React.useState<string>("");

  useEffect(() => {
    if (!date) return;
    setStringDate(formatDate(date, "MMMM dd, yyyy"));
  }, [date]);

  return (
    <Popover modal={modal}>
      <div className="relative w-full">
        <Input
          type="string"
          value={stringDate}
          name={name}
          id={id}
          onChange={(e) => {
            setStringDate(e.target.value);
            const parsedDate = new Date(e.target.value);
            if (parsedDate.toString() === "Invalid Date") {
              onChange(undefined);
            } else {
              onChange(parsedDate);
            }
          }}
          required={required}
        />
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "font-normal cursor-pointer absolute right-0 translate-y-[-50%] top-[50%] rounded-l-none",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={(selectedDate) => {
            if (!selectedDate) return;
            onChange(selectedDate);
            setStringDate(formatDate(selectedDate, "MMMM dd, yyyy"));
          }}
          defaultMonth={date}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
