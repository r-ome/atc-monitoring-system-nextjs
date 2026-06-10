"use client";

import { Expense, PettyCash } from "src/entities/models/Expense";
import { AddExpenseModal } from "./components/expenses/AddExpenseModal";
import { UpdatePettyCashModal } from "./components/expenses/UpdatePettyCashModal";
import { ExpensesTable } from "./components/expenses/ExpensesTable";
import { ExpensesHeader } from "./components/expenses/ExpensesHeader";
import { ExpenseUpdateLogsAlert } from "./components/expenses/ExpenseUpdateLogsAlert";
import { ActivityLog } from "src/entities/models/ActivityLog";

interface ExpensesTabProps {
  user: { role: string; branch: { branch_id: string; name: string } };
  expenses: Expense[];
  expenseUpdateLogs: ActivityLog[];
  selectedBranch: { branch_id: string } | null;
  lastPettyCash: PettyCash | null;
  currentPettyCash: PettyCash | null;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  expenseUpdateLogs,
  selectedBranch,
  currentPettyCash,
  lastPettyCash,
  user,
}) => {
  const isAdmin = ["SUPER_ADMIN", "OWNER"].includes(user.role);
  const actionButtons = selectedBranch ? (
    <>
      <AddExpenseModal
        currentPettyCash={currentPettyCash}
        selectedBranch={selectedBranch}
      />
      {isAdmin ? (
        <UpdatePettyCashModal
          pettyCash={currentPettyCash}
          selectedBranch={selectedBranch}
        />
      ) : null}
    </>
  ) : null;

  return (
    <div className="flex flex-col gap-4">
      <ExpenseUpdateLogsAlert expenseUpdateLogs={expenseUpdateLogs} />

      <ExpensesHeader
        expenses={expenses}
        currentPettyCash={currentPettyCash}
        lastPettyCash={lastPettyCash}
      />

      <ExpensesTable
        expenses={expenses}
        user={user}
        actionButtons={actionButtons}
      />
    </div>
  );
};
