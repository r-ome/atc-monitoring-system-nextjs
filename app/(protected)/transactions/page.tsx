"use client";
import { useRouter } from "next/navigation";
import { HandCoins } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { formatDate } from "@/app/lib/utils";
import { FullScreenCalendar } from "@/app/components/fullscreen-calendar/fullscreen-calendar";
import { ConsistencyCheckerDialog } from "./[transaction_date]/ConsistencyCheckerDialog";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";

export default function Page() {
  const router = useRouter();

  return (
    <PageContainer>
      <PageHeader
        title="Transactions"
        subtitle="Choose a date to review transactions"
        actions={<ConsistencyCheckerDialog />}
      />

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <HandCoins size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            Transaction Calendar
          </span>
        </div>

        <FullScreenCalendar
          onDayClick={(date) => {
            const formattedStringDate = formatDate(date, "yyyy-MM-dd");
            router.push(`/transactions/${formattedStringDate}`);
          }}
        />
      </Card>
    </PageContainer>
  );
}
