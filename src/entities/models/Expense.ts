import { z } from "zod";
import { Prisma } from "@prisma/client";

export type EXPENSE_PURPOSE = "ADD_PETTY_CASH" | "EXPENSE";

export type ExpenseSchema = Prisma.expensesGetPayload<object>;
export type Expense = {
  expense_id: string;
  balance: number;
  amount: number;
  purpose: EXPENSE_PURPOSE;
  remarks: string | null;
  created_at: string;
};

export const ExpenseInsertSchema = z.object({
  amount: z.coerce.number(),
  purpose: z.enum(["ADD_PETTY_CASH", "EXPENSE"]),
  remarks: z.string().min(1),
  created_at: z.date(),
});

export type ExpenseInsertSchema = z.infer<typeof ExpenseInsertSchema>;
