import { ReportsRepository } from "src/infrastructure/di/repositories";
import { FilterMode } from "src/entities/models/Report";
import { DatabaseOperationError } from "src/entities/errors/common";
import { presentTotalSales } from "src/controllers/reports/get-total-sales.controller";
import { presentTotalExpenses } from "src/controllers/reports/get-total-expenses.controller";
import { presentPaymentMethodBreakdown } from "src/controllers/reports/get-payment-method-breakdown.controller";
import { presentCashFlow } from "src/controllers/reports/get-daily-cash-flow.controller";
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
  try {
    const [auctions, expenses, payments, cashFlowReceipts] = await Promise.all([
      ReportsRepository.getTotalSales(branchId, dateParam),
      ReportsRepository.getTotalExpenses(branchId, dateParam),
      ReportsRepository.getPaymentMethodBreakdown(branchId, dateParam),
      ReportsRepository.getDailyCashFlowPayments(branchId, dateParam),
    ]);

    const sales = presentTotalSales(auctions, mode);
    const expenseRows = presentTotalExpenses(expenses, mode);
    const paymentMethod = presentPaymentMethodBreakdown(payments);
    const cashFlow = presentCashFlow(cashFlowReceipts, expenses, mode);

    return (
      <div className="flex flex-col gap-4 pt-2">
        <Card>
          <CardHeader><CardTitle>Sales & Expenses Summary</CardTitle></CardHeader>
          <CardContent>
            <SalesTable sales={sales} expenses={expenseRows} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader>
          <CardContent>
            <PaymentMethodBreakdownTable data={paymentMethod} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader>
          <CardContent>
            <DailyCashFlowTable data={cashFlow} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    const cause = error instanceof DatabaseOperationError ? error.message : "Server Error";
    return <ErrorComponent error={{ message: "Failed to load financial reports", cause }} />;
  }
};
