import { z } from "zod";
import { Prisma } from "@prisma/client";

export const EXPENSE_PURPOSE = ["ADD_PETTY_CASH", "EXPENSE", "SALARY"] as const;
export type ExpensePurpose = (typeof EXPENSE_PURPOSE)[number];

export type PettyCashWithBranchRow = Prisma.petty_cashGetPayload<{
  include: { branch: true };
}>;

export type ExpenseWithBranchRow = Prisma.expensesGetPayload<{
  include: { branch: true; employee: true };
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
  employee?: {
    employee_id: string;
    first_name: string;
    last_name: string;
    full_name: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export const createExpenseSchema = z
  .object({
    amount: z.coerce.number(),
    purpose: z.enum(EXPENSE_PURPOSE),
    remarks: z.string().min(1),
    branch_id: z.string(),
    employee_id: z.string().optional().nullable(),
    created_at: z.string(),
  })
  .refine((data) => data.purpose !== "SALARY" || !!data.employee_id, {
    message: "Employee is required for salary expenses.",
    path: ["employee_id"],
  });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = z
  .object({
    amount: z.coerce.number(),
    purpose: z.enum(EXPENSE_PURPOSE),
    remarks: z.string().min(1),
    branch_id: z.string(),
    employee_id: z.string().optional().nullable(),
  })
  .refine((data) => data.purpose !== "SALARY" || !!data.employee_id, {
    message: "Employee is required for salary expenses.",
    path: ["employee_id"],
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

export type ConsistencyIssue = {
  day: string;
  stored: number;
  expected: number;
  drift: number;
};

export type PettyCashSnapshot = { petty_cash_id: string; amount: number }[];

export type RepairResult = {
  repaired_from: string;
  days_fixed: number;
  snapshot: PettyCashSnapshot;
};
