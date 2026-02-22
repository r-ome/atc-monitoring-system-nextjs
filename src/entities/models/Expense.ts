import { z } from "zod";
import { Prisma } from "@prisma/client";

export type ExpensePurpose = "ADD_PETTY_CASH" | "EXPENSE";

export type PettyCashWithBranchRow = Prisma.petty_cashGetPayload<{
  include: { branch: true };
}>;

export type ExpenseWithBranchRow = Prisma.expensesGetPayload<{
  include: { branch: true };
}>;

export type Expense = {
  expense_id: string;
  amount: number;
  purpose: ExpensePurpose;
  remarks: string;
  branch: {
    branch_id: string;
    name: string;
  };
  created_at: string;
};

export const createExpenseSchema = z.object({
  amount: z.coerce.number(),
  purpose: z.enum(["ADD_PETTY_CASH", "EXPENSE"]),
  remarks: z.string().min(1),
  branch_id: z.string(),
  created_at: z.string(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z.object({
  amount: z.coerce.number(),
  purpose: z.string(),
  remarks: z.string(),
  branch_id: z.string(),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export type PettyCash = {
  petty_cash_id: string;
  amount: number;
  remarks: string;
  branch: {
    branch_id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
};

export const createPettyCashSchema = z.object({
  amount: z.coerce.number(),
  remarks: z.string().nullable(),
  created_at: z.string(),
  branch_id: z.string(),
});

export type CreatePettyCashInput = z.infer<typeof createPettyCashSchema>;
