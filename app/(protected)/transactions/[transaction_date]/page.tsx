import {
  getExpensesByDate,
  getPaymentsByDate,
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

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ transaction_date: string }> }>) {
  const { transaction_date } = await params;
  const transactions_res = await getPaymentsByDate(transaction_date);
  const expenses_res = await getExpensesByDate(transaction_date);

  if (!transactions_res.ok || !expenses_res.ok) {
    const err = [transactions_res, expenses_res].find((res) => !res.ok)?.error;
    if (!err) return;
    return <ErrorComponent error={err} />;
  }

  const transactions = transactions_res.value;
  const expenses = expenses_res.value.expenses;
  const yesterday_balance = expenses_res.value.yesterday_balance;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between">
              <h1 className="uppercase text-xl">
                {formatDate(new Date(transaction_date), "MMMM dd, yyyy")} Cash
                Book
              </h1>

              <div className="flex gap-4">
                <GenerateExpenseReport
                  transactions={transactions}
                  expenses={expenses}
                  yesterdayBalance={yesterday_balance}
                />
                <AddExpenseModal />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="inward">
            <TabsList>
              <TabsTrigger value="inward">Inward Transactions</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="inward">
              <InwardTransactionsTab transactions={transactions} />
            </TabsContent>
            <TabsContent value="expense">
              <ExpensesTab
                expenses={expenses}
                yesterdayBalance={yesterday_balance}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
