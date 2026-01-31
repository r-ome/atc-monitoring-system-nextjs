"use client";

import { Expense, PettyCash } from "src/entities/models/Expense";
import { AddExpenseModal } from "./components/expenses/AddExpenseModal";
import { UpdatePettyCashModal } from "./components/expenses/UpdatePettyCashModal";
import { ExpensesTable } from "./components/expenses/ExpensesTable";
import { ExpensesHeader } from "./components/expenses/ExpensesHeader";

interface ExpensesTabProps {
  user: { role: string; branch: { branch_id: string; name: string } };
  expenses: Expense[];
  selectedBranch: { branch_id: string } | null;
  lastPettyCash: PettyCash | null;
  currentPettyCash: PettyCash | null;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  selectedBranch,
  currentPettyCash,
  lastPettyCash,
  user,
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end w-full gap-4">
        {selectedBranch ? (
          <>
            <AddExpenseModal
              currentPettyCash={currentPettyCash}
              selectedBranch={selectedBranch}
            />
            {["SUPER_ADMIN", "OWNER"].includes(user.role) ? (
              <UpdatePettyCashModal
                pettyCash={currentPettyCash}
                selectedBranch={selectedBranch}
              />
            ) : null}
          </>
        ) : null}
      </div>

      <ExpensesHeader
        expenses={expenses}
        currentPettyCash={currentPettyCash}
        lastPettyCash={lastPettyCash}
      />

      <ExpensesTable expenses={expenses} user={user} />
    </div>
  );
};
