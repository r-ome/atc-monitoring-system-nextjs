import { FilterMode } from "src/entities/models/Report";
import { GetFinancialReportController } from "src/controllers/reports/get-financial-report.controller";
import { SalesTable } from "./SalesTable";
import { PaymentMethodBreakdownTable } from "./PaymentMethodBreakdownTable";
import { DailyCashFlowTable } from "./DailyCashFlowTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface Props {
  branchId: string;
  dateParam: string;
  mode: FilterMode;
}

export const FinancialTabContent = async ({ branchId, dateParam, mode }: Props) => {
  const res = await GetFinancialReportController(branchId, dateParam, mode);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Card>
        <CardHeader><CardTitle>Sales & Expenses Summary</CardTitle></CardHeader>
        <CardContent>
          <SalesTable sales={res.value.sales} expenses={res.value.expenses} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader>
        <CardContent>
          <PaymentMethodBreakdownTable data={res.value.paymentMethodBreakdown} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader>
        <CardContent>
          <DailyCashFlowTable data={res.value.cashFlow} />
        </CardContent>
      </Card>
    </div>
  );
};
