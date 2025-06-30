import { Prisma } from "@prisma/client";

export const EXPENSE_PURPOSE = ["REFUND", "EXPENSE"];
export type EXPENSE_PURPOSE = "REFUND" | "EXPENSE";

export type ExpensesSchema = Prisma.expensesGetPayload<object>;

export type Expense = {
  expense_id: string;
  balance: number;
  amount: number;
  purpose: EXPENSE_PURPOSE;
  remarks?: string;
};
