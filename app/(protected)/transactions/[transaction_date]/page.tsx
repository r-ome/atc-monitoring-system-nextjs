"use server";

import { redirect } from "next/navigation";
import {
  getExpensesByDate,
  getPaymentsByDate,
  getPettyCashBalance,
} from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/app/components/ui/card";
import { getEnabledPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { subDays } from "date-fns";
import { formatDate } from "@/app/lib/utils";

import { getBranches } from "../../branches/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { requireSession } from "@/app/lib/auth";
import { TransactionHeader } from "./components/TransactionHeader";
import { InwardTransactionsTab } from "./InwardTransactionsTab";
import { ExpensesTab } from "./ExpensesTab";
import { PayrollTab } from "./PayrollTab";
import { GenerateExpenseReport } from "./GenerateExpenseReport";

export default async function Page({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ transaction_date: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}>) {
  const { branch_id } = await searchParams;
  const { transaction_date } = await params;
  const session = await requireSession();

  const { user } = session;

  const [payment_methods_res, branches_res] = await Promise.all([
    getEnabledPaymentMethods(),
    getBranches(),
  ]);


  if (!payment_methods_res.ok || !branches_res.ok) {
    return <ErrorComponent error={{ message: "Server Error" }} />;
  }
  const payment_methods = payment_methods_res.value;
  const branches = branches_res.value;

  const fallbackBranch = ["SUPER_ADMIN", "OWNER"].includes(user.role)
    ? (branches.find((b) => b.name === "BIÑAN") ?? null)
    : (branches.find((b) => b.branch_id === user.branch.branch_id) ?? null);

  const branchId = String(branch_id ?? fallbackBranch?.branch_id);
  if (!branchId) redirect("/");

  const selected_branch =
    branches.find((b) => b.branch_id === branchId) ?? fallbackBranch;

  const last_working_day = formatDate(
    subDays(transaction_date, 1),
    "yyyy-MM-dd",
  );

  const [
    transactions_res,
    expenses_res,
    current_petty_cash_res,
    last_petty_cash_res,
  ] = await Promise.all([
    getPaymentsByDate(transaction_date, selected_branch?.branch_id),
    getExpensesByDate(transaction_date, selected_branch?.branch_id),
    getPettyCashBalance(transaction_date, selected_branch?.branch_id),
    getPettyCashBalance(last_working_day, selected_branch?.branch_id),
  ]);

  if (
    !transactions_res.ok ||
    !expenses_res.ok ||
    !current_petty_cash_res.ok ||
    !last_petty_cash_res.ok
  ) {
    return <ErrorComponent error={{ message: "Server Error" }} />;
  }

  const expenses = expenses_res.value;
  const transactions = transactions_res.value;
  const current_petty_cash = current_petty_cash_res.value;
  const last_petty_cash = last_petty_cash_res.value;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex gap-4">
              <TransactionHeader
                user={user}
                selectedBranch={selected_branch}
                branches={branches}
              />
              <GenerateExpenseReport
                transactions={transactions}
                expenses={expenses}
                yesterdayPettyCash={last_petty_cash}
                paymentMethods={payment_methods}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inward">
            <TabsList className="w-fit max-w-full">
              <TabsTrigger value="inward" className="flex-none">
                Inward Transactions
              </TabsTrigger>
              <TabsTrigger value="expense" className="flex-none">
                Expenses
              </TabsTrigger>
              <TabsTrigger value="payroll" className="flex-none">
                Payroll
              </TabsTrigger>
            </TabsList>
            <TabsContent value="inward">
              <InwardTransactionsTab transactions={transactions} />
            </TabsContent>
            <TabsContent value="expense">
              <ExpensesTab
                expenses={expenses}
                selectedBranch={selected_branch}
                currentPettyCash={current_petty_cash}
                lastPettyCash={last_petty_cash}
                user={user}
              />
            </TabsContent>
            <TabsContent value="payroll">
              <PayrollTab
                expenses={expenses}
                selectedBranch={selected_branch}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
