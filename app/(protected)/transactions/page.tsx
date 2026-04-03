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
import { ConsistencyCheckerDialog } from "./[transaction_date]/ConsistencyCheckerDialog";

export default function Page() {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>Choose a date</CardDescription>
            </div>
            <ConsistencyCheckerDialog />
          </div>
        </CardHeader>
        <CardContent>
          <FullScreenCalendar
            onDayClick={(date) => {
              const formattedStringDate = formatDate(date, "yyyy-MM-dd");
              router.push(`/transactions/${formattedStringDate}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
