import { FilterMode } from "src/entities/models/Report";
import { GetFinancialReportController } from "src/controllers/reports/get-financial-report.controller";
import { SalesTable } from "./SalesTable";
import { ExpensesSummaryTable } from "./ExpensesSummaryTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getExpensesSummary } from "../actions";

interface Props {
  branchId: string;
  branchName: string;
  dateParam: string;
  mode: FilterMode;
  userRole: string;
}

export const FinancialTabContent = async ({
  branchId,
  branchName,
  dateParam,
  mode,
  userRole,
}: Props) => {
  const [res, expensesSummaryRes] = await Promise.all([
    GetFinancialReportController(branchId, dateParam, mode),
    getExpensesSummary(branchId, dateParam),
  ]);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  if (!expensesSummaryRes.ok) {
    return <ErrorComponent error={expensesSummaryRes.error} />;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <SalesTable
        summary={res.value.salesExpensesSummary}
        branchName={branchName}
      />
      {userRole === "SUPER_ADMIN" ? (
        <Card>
          <CardHeader><CardTitle>Expenses Summary</CardTitle></CardHeader>
          <CardContent>
            <ExpensesSummaryTable
              branchName={branchName}
              data={expensesSummaryRes.value}
              dateParam={dateParam}
              mode={mode}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
