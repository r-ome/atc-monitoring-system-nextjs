"use client";
import { redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { formatDate } from "@/app/lib/utils";
import { FullScreenCalendar } from "@/app/components/fullscreen-calendar/fullscreen-calendar";

export default function Page() {
  return (
    <div className="flex gap-2">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>Choose a date</CardDescription>
        </CardHeader>
        <CardContent>
          <FullScreenCalendar
            onDayClick={(date) => {
              const formattedStringDate = formatDate(date, "yyyy-MM-dd");
              redirect(`/transactions/${formattedStringDate}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
