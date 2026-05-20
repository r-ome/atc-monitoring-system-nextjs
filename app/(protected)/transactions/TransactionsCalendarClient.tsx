"use client";

import { useRouter } from "next/navigation";
import { HandCoins } from "lucide-react";
import { Branch } from "src/entities/models/Branch";
import { Card } from "@/app/components/ui/card";
import { formatDate } from "@/app/lib/utils";
import { FullScreenCalendar } from "@/app/components/fullscreen-calendar/fullscreen-calendar";
import { ConsistencyCheckerDialog } from "./[transaction_date]/ConsistencyCheckerDialog";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { DownloadMonthlyExpensesReport } from "./DownloadMonthlyExpensesReport";

interface TransactionsCalendarClientProps {
  user: { role: string };
  branches: Branch[];
  selectedBranch: { branch_id: string; name: string };
}

export const TransactionsCalendarClient = ({
  user,
  branches,
  selectedBranch,
}: TransactionsCalendarClientProps) => {
  const router = useRouter();
  const canSelectBranch = ["SUPER_ADMIN", "OWNER"].includes(user.role);

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
          renderHeaderActions={(month) => (
            <DownloadMonthlyExpensesReport
              month={month}
              branchId={selectedBranch.branch_id}
              branchName={selectedBranch.name}
              branches={canSelectBranch ? branches : undefined}
            />
          )}
          onDayClick={(date) => {
            const formattedStringDate = formatDate(date, "yyyy-MM-dd");
            const params = new URLSearchParams();
            params.set("branch_id", selectedBranch.branch_id);
            router.push(
              `/transactions/${formattedStringDate}?${params.toString()}`,
            );
          }}
        />
      </Card>
    </PageContainer>
  );
};
