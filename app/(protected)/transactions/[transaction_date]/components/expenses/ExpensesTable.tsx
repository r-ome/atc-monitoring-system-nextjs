"use client";

import { useState } from "react";
import { Row, CoreRow } from "@tanstack/react-table";
import { Receipt } from "lucide-react";
import { Expense } from "src/entities/models/Expense";
import { columns } from "./expenses-columns";
import { DataTable } from "@/app/components/data-table/data-table";
import { ExpenseTypeBadge } from "@/app/components/admin";
import { UpdateExpenseModal } from "./UpdateExpenseModal";

interface ExpensesTableProps {
  expenses: Expense[];
  user: { role: string; branch: { branch_id: string; name: string } };
  actionButtons?: React.ReactNode;
}

export const ExpensesTable: React.FC<ExpensesTableProps> = ({
  expenses,
  user,
  actionButtons,
}) => {
  const [openUpdateExpenseModal, setOpenUpdateExpenseModal] =
    useState<boolean>(false);

  const [selectedExpense, setSelectedExpense] = useState<{
    expense_id: string;
    amount: number;
    remarks: string;
    purpose: "EXPENSE" | "ADD_PETTY_CASH" | "SALARY";
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

  const renderMobileCard = (row: Row<Expense>) => {
    const e = row.original;
    const amount = e.amount.toLocaleString();
    const isExpense = e.purpose === "EXPENSE" || e.purpose === "SALARY";
    return (
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <ExpenseTypeBadge expenseType={e.purpose} />
          </div>
          {e.remarks ? (
            <span className="truncate text-[13.5px] font-medium">
              {e.remarks}
            </span>
          ) : null}
          <span className="text-[12px] text-muted-foreground">
            {e.created_at}
          </span>
        </div>
        <span
          className={
            "shrink-0 font-mono text-[14px] font-semibold " +
            (isExpense ? "text-status-error" : "text-status-success")
          }
        >
          {isExpense ? `(${amount})` : amount}
        </span>
      </div>
    );
  };

  return (
    <>
      <DataTable
        embedded={false}
        icon={Receipt}
        title="Expenses"
        meta={`${expenses.length.toLocaleString()} ${expenses.length === 1 ? "entry" : "entries"}`}
        rowLabel="expense"
        columns={columns}
        data={expenses}
        renderMobileCard={renderMobileCard}
        actionButtons={actionButtons}
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
