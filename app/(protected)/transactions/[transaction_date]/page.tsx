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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { formatDate } from "@/app/lib/utils";
import { InwardTransactionsTab } from "./InwardTransactionsTab";
import { ExpensesTab } from "./ExpensesTab";
import { AddExpenseModal } from "./AddExpenseModal";
import { GenerateExpenseReport } from "./GenerateExpenseReport";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ transaction_date: string }> }>) {
  const { transaction_date } = await params;
  const transactions_res = await getPaymentsByDate(transaction_date);
  const expenses_res = await getExpensesByDate(transaction_date);
  const petty_cash_res = await getPettyCashBalance(transaction_date);
  const payment_methods_res = await getPaymentMethods();

  if (
    !transactions_res.ok ||
    !expenses_res.ok ||
    !petty_cash_res.ok ||
    !payment_methods_res.ok
  ) {
    const err = [
      transactions_res,
      expenses_res,
      petty_cash_res,
      payment_methods_res,
    ].find((res) => !res.ok)?.error;
    if (!err) return;
    return <ErrorComponent error={err} />;
  }

  const transactions = transactions_res.value;
  const expenses = expenses_res.value.expenses;
  const petty_cash_balance = petty_cash_res.value;
  const payment_methods = payment_methods_res.value;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between flex-col md:flex-row gap-2">
              <h1 className="uppercase text-xl">
                {formatDate(new Date(transaction_date), "MMMM dd, yyyy")} Cash
                Book
              </h1>

              <div className="flex gap-4">
                <GenerateExpenseReport
                  transactions={transactions}
                  expenses={expenses}
                  yesterdayBalance={petty_cash_balance}
                  paymentMethods={payment_methods}
                />
                <AddExpenseModal />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inward">
            <TabsList className="w-full md:w-[230px]">
              <TabsTrigger value="inward">Inward Transactions</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="inward">
              <InwardTransactionsTab transactions={transactions} />
            </TabsContent>
            <TabsContent value="expense">
              <ExpensesTab
                expenses={expenses}
                pettyCashBalance={petty_cash_balance}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
