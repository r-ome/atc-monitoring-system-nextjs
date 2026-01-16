"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useParams } from "next/navigation";
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
// import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { Badge } from "@/app/components/ui/badge";
import { subDays, isMonday } from "date-fns";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { getBranches } from "../../branches/actions";
import { Payment } from "src/entities/models/Payment";
import { Expense, PettyCash } from "src/entities/models/Expense";
import { UpdatePettyCashModal } from "./UpdatePettyCashModal";

export default function Page() {
  const { transaction_date }: { transaction_date: string } = useParams();
  const [transactions, setTransactions] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [pettyCash, setPettyCash] = useState<PettyCash | null>(null);
  const [pettyCashBalance, setPettyCashBalance] = useState<PettyCash | null>(
    null
  );
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<{
    branch_id: string;
    name: string;
  }>();
  const [branches, setBranches] = useState<
    { branch_id: string; name: string }[]
  >([]);
  const session = useSession();
  if (session.data === null) redirect("/");
  const user = session.data?.user;
  if (user === null) redirect("/");

  useEffect(() => {
    const fetchInitialData = async () => {
      const transactions_res = await getPaymentsByDate(transaction_date);
      const expenses_res = await getExpensesByDate(transaction_date);
      const payment_methods_res = await getPaymentMethods();
      const branch_res = await getBranches();

      if (transactions_res.ok) setTransactions(transactions_res.value);
      if (payment_methods_res.ok) setPaymentMethods(payment_methods_res.value);

      if (expenses_res.ok) setExpenses(expenses_res.value.expenses);
      if (branch_res.ok) {
        setBranches(branch_res.value);
        setSelectedBranch(branch_res.value[0]);
      }
    };
    fetchInitialData();
  }, [transaction_date]);

  useEffect(() => {
    const fetchPaymentsByBranch = async () => {
      if (!selectedBranch) return;

      const transaction_res = await getPaymentsByDate(
        transaction_date,
        selectedBranch.branch_id
      );
      const expenses_res = await getExpensesByDate(
        transaction_date,
        selectedBranch.branch_id
      );

      const petty_cash_res = await getPettyCashBalance(
        transaction_date,
        selectedBranch.branch_id
      );
      const last_working_day = isMonday(transaction_date)
        ? subDays(transaction_date, 2)
        : subDays(transaction_date, 1);
      const petty_cash_balance_res = await getPettyCashBalance(
        formatDate(last_working_day, "yyyy-MM-dd"),
        selectedBranch.branch_id
      );

      if (petty_cash_res.ok) setPettyCash(petty_cash_res.value);
      if (petty_cash_balance_res.ok)
        setPettyCashBalance(petty_cash_balance_res.value);

      if (expenses_res.ok) setExpenses(expenses_res.value.expenses);
      if (transaction_res.ok) setTransactions(transaction_res.value);
    };
    fetchPaymentsByBranch();
  }, [selectedBranch, transaction_date]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between flex-col md:flex-row gap-2">
              <div className="">
                <h1 className="uppercase text-xl flex items-center gap-2">
                  {user && ["SUPER_ADMIN", "OWNER"].includes(user.role) ? (
                    <div className="w-30">
                      <Select
                        value={selectedBranch?.branch_id}
                        onValueChange={(value) => {
                          const branch = branches.find(
                            (item) => item.branch_id === value
                          );
                          setSelectedBranch(branch);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Branch"></SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {branches.map((item) => (
                              <SelectItem
                                key={item.branch_id}
                                value={item.branch_id}
                              >
                                {item.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  {formatDate(new Date(transaction_date), "MMMM dd, yyyy")} Cash
                  Book{" "}
                  {selectedBranch ? (
                    <Badge
                      variant={
                        selectedBranch.name === "TARLAC" ? "success" : "warning"
                      }
                    >
                      {selectedBranch.name}
                    </Badge>
                  ) : null}
                </h1>
              </div>

              <div className="flex gap-4">
                <GenerateExpenseReport
                  transactions={transactions}
                  expenses={expenses}
                  yesterdayBalance={
                    pettyCashBalance ? pettyCashBalance?.balance : 0
                  }
                  paymentMethods={paymentMethods}
                />
                <AddExpenseModal pettyCash={pettyCash} />
                <UpdatePettyCashModal pettyCash={pettyCash} />
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
                pettyCash={pettyCash}
                pettyCashBalance={pettyCashBalance}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}
