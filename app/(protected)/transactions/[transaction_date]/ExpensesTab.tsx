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
  pettyCashBalance: number;
}

type ExpenseTypesTotal = {
  PETTY_CASH_BALANCE: number;
  CASH_ON_HAND_FOR_PETTY_CASH: number;
  TOTAL_EXPENSES: number;
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  pettyCashBalance,
}) => {
  const [expenseTypesTotal, setExpenseTypesTotal] = useState<ExpenseTypesTotal>(
    {
      PETTY_CASH_BALANCE: 0,
      CASH_ON_HAND_FOR_PETTY_CASH: 0,
      TOTAL_EXPENSES: 0,
    }
  );

  useEffect(() => {
    const total = expenses
      .filter((item) => item.purpose === "EXPENSE")
      .reduce((acc, item) => (acc += item.amount), 0);
    const cashOnHand = expenses
      .filter((item) => item.purpose === "ADD_PETTY_CASH")
      .reduce((acc, item) => (acc += item.amount), 0);

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
              <TableCell>{item.purpose.replace(/_/g, " ")}</TableCell>
              <TableCell>{item.balance.toLocaleString()}</TableCell>
              <TableCell>{item.amount.toLocaleString()}</TableCell>
              <TableCell>{item.remarks?.toLocaleUpperCase()}</TableCell>
              <TableCell>{item.created_at}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
