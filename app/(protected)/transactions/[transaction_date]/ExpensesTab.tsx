"use client";

import { useEffect, useState } from "react";
import { Expense } from "src/entities/models/Expense";
import { Card, CardTitle, CardDescription } from "@/app/components/ui/card";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/app/components/ui/table";

interface ExpensesTabProps {
  expenses: Expense[];
  yesterdayBalance: number;
}

type ExpenseTypesTotal = {
  PETTY_CASH_BALANCE: number;
  CASH_ON_HAND_FOR_PETTY_CASH: number;
  TOTAL_EXPENSES: number;
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  yesterdayBalance,
}) => {
  const [expenseTypesTotal, setExpenseTypesTotal] = useState<ExpenseTypesTotal>(
    {
      PETTY_CASH_BALANCE: 0,
      CASH_ON_HAND_FOR_PETTY_CASH: 0,
      TOTAL_EXPENSES: 0,
    }
  );

  useEffect(() => {
    const total = expenses.reduce((acc, item) => (acc += item.amount), 0);
    const cashOnHand = expenses[0]?.balance || 0;
    const pettyCashBalance = yesterdayBalance + cashOnHand;
    setExpenseTypesTotal((prev) => ({
      ...prev,
      TOTAL_EXPENSES: total,
      CASH_ON_HAND_FOR_PETTY_CASH: cashOnHand,
      PETTY_CASH_BALANCE: pettyCashBalance,
    }));
  }, [expenses]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Object.keys(expenseTypesTotal).map((item) => (
          <Card key={item} className="flex-1 py-3 px-4">
            <CardTitle className="text-lg">
              ₱
              {expenseTypesTotal[
                item as keyof ExpenseTypesTotal
              ].toLocaleString()}
            </CardTitle>
            <CardDescription className="text-sm -mt-4">
              {item.replace(/_/g, " ")}
            </CardDescription>
          </Card>
        ))}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Purpose</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Remarks</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((item) => (
            <TableRow key={item.expense_id}>
              <TableCell>{item.purpose}</TableCell>
              <TableCell>{item.balance}</TableCell>
              <TableCell>{item.amount}</TableCell>
              <TableCell>{item.remarks}</TableCell>
              <TableCell>{item.created_at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
