import {
  ExpenseWithBranchRow,
  UpdateExpenseInput,
  CreateExpenseInput,
  PettyCashWithBranchRow,
  CreatePettyCashInput,
  PettyCash,
  ConsistencyIssue,
  PettyCashSnapshot,
  RepairResult,
} from "src/entities/models/Expense";

export interface IExpenseRepository {
  getExpensesByDate: (
    date: string,
    branch_id: string | undefined,
  ) => Promise<ExpenseWithBranchRow[]>;
  addExpense: (
    petty_cash_id: string,
    input: CreateExpenseInput,
  ) => Promise<ExpenseWithBranchRow>;
  getPettyCashBalance: (
    date: string,
    branch_id: string | undefined,
  ) => Promise<PettyCashWithBranchRow | null>;
  updateExpense: (
    expense_id: string,
    data: UpdateExpenseInput,
  ) => Promise<{ updated: ExpenseWithBranchRow; previous: { amount: number; remarks: string | null } }>;
  updatePettyCash: (
    petty_cash_id: string,
    data: CreatePettyCashInput,
  ) => Promise<PettyCashWithBranchRow>;
  deleteExpense: (expense_id: string) => Promise<{ amount: number; remarks: string | null; created_at: Date }>;
  recalculatePettyCash: (petty_cash: PettyCash) => Promise<void>;
  checkConsistency: (
    branch_id: string,
    startDate: string,
    endDate: string,
  ) => Promise<ConsistencyIssue[]>;
  repairConsistency: (
    branch_id: string,
    startDate: string,
    endDate: string,
  ) => Promise<RepairResult | null>;
  undoRepair: (snapshot: PettyCashSnapshot) => Promise<void>;
}
