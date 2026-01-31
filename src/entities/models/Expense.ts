import { z } from "zod";
import { Prisma } from "@prisma/client";

export type EXPENSE_PURPOSE = "ADD_PETTY_CASH" | "EXPENSE";

export type PettyCashSchema = Prisma.petty_cashGetPayload<{
  include: { branch: true };
}>;

export type ExpenseSchema = Prisma.expensesGetPayload<{
  include: { branch: true };
}>;
export type Expense = {
  expense_id: string;
  amount: number;
  purpose: EXPENSE_PURPOSE;
  remarks: string;
  branch: {
    branch_id: string;
    name: string;
  };
  created_at: string;
};

export const ExpenseInsertSchema = z.object({
  amount: z.coerce.number(),
  purpose: z.enum(["ADD_PETTY_CASH", "EXPENSE"]),
  remarks: z.string().min(1),
  branch_id: z.string(),
  created_at: z.string(),
});

export type ExpenseInsertSchema = z.infer<typeof ExpenseInsertSchema>;

export const UpdateExpenseInput = z.object({
  amount: z.coerce.number(),
  purpose: z.string(),
  remarks: z.string(),
  branch_id: z.string(),
});

export type UpdateExpenseInputSchema = z.infer<typeof UpdateExpenseInput>;

export type PettyCash = {
  petty_cash_id: string;
  amount: number;
  remarks: string;
  created_at: string;
  updated_at: string;
};

export const PettyCashInsertSchema = z.object({
  amount: z.coerce.number(),
  remarks: z.string().nullable(),
  created_at: z.string(),
  branch_id: z.string(),
});

export type PettyCashInsertSchemaType = z.infer<typeof PettyCashInsertSchema>;
