"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Expense, PettyCash } from "src/entities/models/Expense";
import { formatDate } from "@/app/lib/utils";
import { recalculatePettyCash } from "@/app/(protected)/auctions/[auction_date]/payments/actions";

type ExpenseTypesTotal = {
  PETTY_CASH_BALANCE: number;
  YESTERDAY_PETTY_CASH: number;
  CASH_ON_HAND_FOR_PETTY_CASH: number;
  TOTAL_EXPENSES: number;
  TODAY_PETTY_CASH: number;
};

interface ExpensesHeaderProps {
  expenses: Expense[];
  lastPettyCash: PettyCash | null;
  currentPettyCash: PettyCash | null;
}

export const ExpensesHeader: React.FC<ExpensesHeaderProps> = ({
  expenses,
  currentPettyCash,
  lastPettyCash,
}) => {
  const { transaction_date }: { transaction_date: string } = useParams();
  const router = useRouter();
  const [expenseTypesTotal, setExpenseTypesTotal] = useState<ExpenseTypesTotal>(
    {
      PETTY_CASH_BALANCE: 0,
      CASH_ON_HAND_FOR_PETTY_CASH: 0,
      TOTAL_EXPENSES: 0,
      YESTERDAY_PETTY_CASH: 0,
      TODAY_PETTY_CASH: 0,
    },
  );

  useEffect(() => {
    const totalExpenses = expenses
      .filter((item) => item.purpose === "EXPENSE")
      .reduce((acc, item) => (acc += item.amount), 0);

    const totalCurrentPettyCash = expenses
      .filter((item) => item.purpose === "ADD_PETTY_CASH")
      .reduce((acc, item) => (acc += item.amount), 0);

    const PETTY_CASH_BALANCE =
      (lastPettyCash ? lastPettyCash.amount : 0) + totalCurrentPettyCash;

    const TODAY_PETTY_CASH = totalCurrentPettyCash;

    setExpenseTypesTotal((prev) => ({
      ...prev,
      TOTAL_EXPENSES: totalExpenses,
      YESTERDAY_PETTY_CASH: lastPettyCash ? lastPettyCash.amount : 0,
      CASH_ON_HAND_FOR_PETTY_CASH: PETTY_CASH_BALANCE - totalExpenses,
      PETTY_CASH_BALANCE,
      TODAY_PETTY_CASH,
    }));
  }, [expenses, lastPettyCash, currentPettyCash, setExpenseTypesTotal]);

  useEffect(() => {
    const last = lastPettyCash?.amount || 0;

    const totalCurrentPettyCash = expenses
      .filter((item) => item.purpose === "ADD_PETTY_CASH")
      .reduce((acc, item) => (acc += item.amount), 0);

    const totalExpenses = expenses
      .filter((item) => item.purpose === "EXPENSE")
      .reduce((acc, item) => (acc += item.amount), 0);

    const current = (
      currentPettyCash?.amount || 0 + totalCurrentPettyCash
    ).toFixed(2);
    const expected = (last + totalCurrentPettyCash - totalExpenses).toFixed(2);

    const recaculateInitialPettyCash = async (currentPettyCash: PettyCash) => {
      const res = await recalculatePettyCash(currentPettyCash);
      if (res.ok) {
        router.refresh();
      }
    };

    if (currentPettyCash) {
      if (current !== expected) {
        recaculateInitialPettyCash(currentPettyCash);
      }
    }
  }, [lastPettyCash, currentPettyCash]);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-2">
        {Object.keys(expenseTypesTotal).map((item) => (
          <Card key={item} className="flex-1 py-3 px-4">
            <CardTitle className="text-lg">
              ₱
              {expenseTypesTotal[
                item as keyof ExpenseTypesTotal
              ].toLocaleString()}
            </CardTitle>
            <CardDescription className="text-sm -mt-4">
              {item === "TODAY_PETTY_CASH"
                ? `TODAY'S PETTY CASH  (${formatDate(new Date(transaction_date), "MMM dd")})`
                : item.replace(/_/g, " ")}
              {item === "YESTERDAY_PETTY_CASH" && lastPettyCash
                ? ` (${formatDate(new Date(lastPettyCash?.created_at), "MMM-dd")})`
                : null}
            </CardDescription>
          </Card>
        ))}
      </div>
    </>
  );
};
