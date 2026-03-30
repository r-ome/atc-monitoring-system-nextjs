"use client";

import { redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { FullScreenCalendar } from "@/app/components/fullscreen-calendar/fullscreen-calendar";
import { formatDate } from "@/app/lib/utils";

export default function Page() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>Choose a date to view user activity</CardDescription>
      </CardHeader>
      <CardContent>
        <FullScreenCalendar
          onDayClick={(date) => {
            const formattedDate = formatDate(date, "yyyy-MM-dd");
            redirect(`/configurations/activity-logs/${formattedDate}`);
          }}
        />
      </CardContent>
    </Card>
  );
}
