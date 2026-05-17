"use client";

import { useRouter } from "next/navigation";
import { Gavel } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { formatDate } from "@/app/lib/utils";
import { FullScreenCalendar } from "@/app/components/fullscreen-calendar/fullscreen-calendar";

export default function Page() {
  const router = useRouter();

  return (
    <PageContainer>
      <PageHeader
        title="Auctions"
        subtitle="Choose the date of the auction"
      />

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <Gavel size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            Auction Calendar
          </span>
        </div>

        <FullScreenCalendar
          onDayClick={(date) => {
            const formattedStringDate = formatDate(date, "yyyy-MM-dd");
            router.push(`/auctions/${formattedStringDate}`);
          }}
        />
      </Card>
    </PageContainer>
  );
}
