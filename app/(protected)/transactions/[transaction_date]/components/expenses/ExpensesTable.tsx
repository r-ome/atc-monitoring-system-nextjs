"use client";

import { useState } from "react";
import { Expense } from "src/entities/models/Expense";
import { columns } from "./expenses-columns";
import { CoreRow } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { UpdateExpenseModal } from "./UpdateExpenseModal";

interface ExpensesTableProps {
  expenses: Expense[];
  user: { role: string; branch: { branch_id: string; name: string } };
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  user,
}) => {
  const [openUpdateExpenseModal, setOpenUpdateExpenseModal] =
    useState<boolean>(false);

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

  const globalFilterFn = (
    row: CoreRow<Expense>,
    _columnId?: string,
    filterValue?: string,
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { amount, remarks } = row.original;

    return [amount, remarks]
      .filter(Boolean)
      .some((field) => field?.toString()!.toLowerCase().includes(search));
  };
  return (
    <>
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
        user={user}
      />
    </>
  );
};
