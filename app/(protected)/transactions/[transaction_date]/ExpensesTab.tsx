"use client";

import { useEffect, useState } from "react";
import { CoreRow } from "@tanstack/react-table";
import { Expense, PettyCash } from "src/entities/models/Expense";
import { Card, CardTitle, CardDescription } from "@/app/components/ui/card";
import { columns } from "./expenses-columns";
import { DataTable } from "@/app/components/data-table/data-table";
import { UpdateExpenseModal } from "./UpdateExpenseModal";

interface ExpensesTabProps {
  expenses: Expense[];
  pettyCash: PettyCash | null;
  pettyCashBalance: PettyCash | null;
}

type ExpenseTypesTotal = {
  PETTY_CASH_BALANCE: number;
  YESTERDAY_PETTY_CASH: number;
  CASH_ON_HAND_FOR_PETTY_CASH: number;
  TOTAL_EXPENSES: number;
};

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  pettyCash,
  pettyCashBalance,
}) => {
  const [expenseTypesTotal, setExpenseTypesTotal] = useState<ExpenseTypesTotal>(
    {
      PETTY_CASH_BALANCE: 0,
      YESTERDAY_PETTY_CASH: 0,
      CASH_ON_HAND_FOR_PETTY_CASH: 0,
      TOTAL_EXPENSES: 0,
    }
  );

  const [selectedExpense, setSelectedExpense] = useState<{
    expense_id: string;
    amount: number;
    remarks: string;
    purpose: "EXPENSE" | "ADD_PETTY_CASH";
  }>({
    expense_id: "",
    amount: 0,
    remarks: "",
    purpose: "ADD_PETTY_CASH",
  });

  const [openUpdateExpenseModal, setOpenUpdateExpenseModal] =
    useState<boolean>(false);

  useEffect(() => {
    const total = expenses
      .filter((item) => item.purpose === "EXPENSE")
      .reduce((acc, item) => (acc += item.amount), 0);

    const totalCurrentPettyCash = expenses
      .filter((item) => item.purpose === "ADD_PETTY_CASH")
      .reduce((acc, item) => (acc += item.amount), 0);

    const PETTY_CASH_BALANCE =
      (pettyCashBalance ? pettyCashBalance.balance : 0) + totalCurrentPettyCash;

    setExpenseTypesTotal((prev) => ({
      ...prev,
      TOTAL_EXPENSES: total,
      YESTERDAY_PETTY_CASH: pettyCashBalance ? pettyCashBalance.balance : 0,
      CASH_ON_HAND_FOR_PETTY_CASH: pettyCash ? pettyCash.balance : 0,
      PETTY_CASH_BALANCE,
    }));
  }, [expenses, setExpenseTypesTotal, pettyCashBalance, pettyCash]);

  const globalFilterFn = (
    row: CoreRow<Expense>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { amount, remarks } = row.original;

    return [amount, remarks]
      .filter(Boolean)
      .some((field) => field?.toString()!.toLowerCase().includes(search));
  };

  return (
    <div className="flex flex-col gap-4">
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
              {item.replace(/_/g, " ")}
            </CardDescription>
          </Card>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={expenses}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search here",
          },
        }}
        onRowClick={(expense) => {
          setOpenUpdateExpenseModal(true);
          setSelectedExpense(expense);
        }}
      />

      <UpdateExpenseModal
        open={openUpdateExpenseModal}
        onOpenChange={setOpenUpdateExpenseModal}
        expense={selectedExpense}
      />
    </div>
  );
};
