"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { subDays } from "date-fns";
import {
  getExpenseUpdateLogs,
  getExpensesByDate,
  getPaymentsByDate,
  getPettyCashBalance,
} from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { getEnabledPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { formatDate } from "@/app/lib/utils";
import { PageContainer } from "@/app/components/PageContainer";

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
  const expense_update_logs_res = await getExpenseUpdateLogs(
    expenses.map((expense) => expense.expense_id),
    selected_branch?.branch_id,
  );

  if (!expense_update_logs_res.ok) {
    return <ErrorComponent error={{ message: "Server Error" }} />;
  }

  const expense_update_logs = expense_update_logs_res.value;

  const formattedDate = formatDate(
    new Date(transaction_date),
    "MMMM dd, yyyy",
  );

  return (
    <PageContainer>
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground 2xl:text-[14px]">
        <Link href="/transactions" className="hover:text-foreground">
          Transactions
        </Link>
        <ChevronRight size={12} className="opacity-60" />
        <span className="font-medium text-foreground">{formattedDate}</span>
      </nav>

      <TransactionHeader
        user={user}
        selectedBranch={selected_branch}
        branches={branches}
        actions={
          <GenerateExpenseReport
            transactions={transactions}
            expenses={expenses}
            yesterdayPettyCash={last_petty_cash}
            paymentMethods={payment_methods}
          />
        }
      />

      <Tabs defaultValue="inward" className="flex flex-col gap-4 2xl:gap-6">
        <TabsList variant="page">
          <TabsTrigger value="inward">Inward Transactions</TabsTrigger>
          <TabsTrigger value="expense">Expenses</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>
        <TabsContent value="inward" className="flex flex-col gap-4 2xl:gap-6">
          <InwardTransactionsTab transactions={transactions} />
        </TabsContent>
        <TabsContent value="expense" className="flex flex-col gap-4 2xl:gap-6">
          <ExpensesTab
            expenses={expenses}
            expenseUpdateLogs={expense_update_logs}
            selectedBranch={selected_branch}
            currentPettyCash={current_petty_cash}
            lastPettyCash={last_petty_cash}
            user={user}
          />
        </TabsContent>
        <TabsContent value="payroll" className="flex flex-col gap-4 2xl:gap-6">
          <PayrollTab expenses={expenses} />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
