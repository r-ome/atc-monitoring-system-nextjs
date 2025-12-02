import { z } from "zod";
import { Prisma } from "@prisma/client";

export type EXPENSE_PURPOSE = "ADD_PETTY_CASH" | "EXPENSE";

export type ExpenseSchema = Prisma.expensesGetPayload<object>;
export type Expense = {
  expense_id: string;
  amount: number;
  purpose: EXPENSE_PURPOSE;
  remarks: string;
  created_at: string;
};

export const ExpenseInsertSchema = z.object({
  amount: z.coerce.number(),
  purpose: z.enum(["ADD_PETTY_CASH", "EXPENSE"]),
  remarks: z.string().min(1),
  created_at: z.date(),
});

export type ExpenseInsertSchema = z.infer<typeof ExpenseInsertSchema>;

export const UpdateExpenseInput = z.object({
  amount: z.coerce.number(),
  purpose: z.string(),
  remarks: z.string(),
});

export type UpdateExpenseInputSchema = z.infer<typeof UpdateExpenseInput>;
