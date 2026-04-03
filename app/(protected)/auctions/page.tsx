"use client";

import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Auctions</CardTitle>
          <CardDescription>Choose the date of the auction</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full border">
            <FullScreenCalendar
              onDayClick={(date) => {
                const formattedStringDate = formatDate(date, "yyyy-MM-dd");
                router.push(`/auctions/${formattedStringDate}`);
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
