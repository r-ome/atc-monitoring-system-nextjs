"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
  const router = useRouter();

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          href="/configurations"
          className="transition-colors hover:text-foreground"
        >
          Configurations
        </Link>
        <ChevronRight size={13} className="shrink-0" />
        <span className="font-medium text-foreground">Activity Logs</span>
      </nav>
      <Card className="w-full">
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>Choose a date to view user activity</CardDescription>
      </CardHeader>
      <CardContent>
        <FullScreenCalendar
          onDayClick={(date) => {
            const formattedDate = formatDate(date, "yyyy-MM-dd");
            router.push(`/configurations/activity-logs/${formattedDate}`);
          }}
        />
      </CardContent>
    </Card>
    </>
  );
}
