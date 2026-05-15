import { z } from "zod";
import { Prisma } from "@prisma/client";

export const EMPLOYEE_STATUS = ["ACTIVE", "INACTIVE"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUS)[number];

export const EMPLOYEE_TYPE = ["REGULAR", "CONTRACTUAL"] as const;
export type EmployeeType = (typeof EMPLOYEE_TYPE)[number];

export const SALARY_TYPE = ["FIXED_MONTHLY", "DAILY_RATE", "TASK_BASED"] as const;
export type SalaryType = (typeof SALARY_TYPE)[number];

export const WORKER_TYPE = ["REGULAR_WORKER", "EXTRA_WORKER"] as const;
export type WorkerType = (typeof WORKER_TYPE)[number];

export const DECLARATION_STATUS = ["DECLARED", "NON_DECLARED"] as const;
export type DeclarationStatus = (typeof DECLARATION_STATUS)[number];

export type EmployeeRow = Prisma.employeesGetPayload<object>;

export type EmployeeWithBranchRow = Prisma.employeesGetPayload<{
  include: { branch: true };
}>;

export type EmployeeDetailRow = Prisma.employeesGetPayload<{
  include: {
    branch: true;
    employment_events: { where: { deleted_at: null }; orderBy: { effective_date: "desc" } };
  };
}>;

export type Employee = {
  employee_id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  full_name: string;
  position?: string | null;
  employee_type: EmployeeType;
  status: EmployeeStatus;
  contact_number?: string | null;
  remarks?: string | null;
  branch: { branch_id: string; name: string };

  // Personal & government info
  birthday?: string | null;
  date_hired?: string | null;
  address?: string | null;
  tin?: string | null;
  sss_number?: string | null;
  philhealth_number?: string | null;
  pagibig_number?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_number?: string | null;

  // Payroll config
  salary_type: SalaryType;
  worker_type: WorkerType;
  declaration_status: DeclarationStatus;
  default_daily_rate?: number | null;
  default_monthly_salary?: number | null;
  default_auction_rate?: number | null;
  default_container_rate?: number | null;
  default_ot_hour_rate?: number | null;
  default_ot_minute_rate?: number | null;

  created_at: string;
  updated_at: string;
};

const dateOrNull = z.union([z.string(), z.date()]).nullable().optional().transform((v) => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().split("T")[0];
  return v;
});

export const createEmployeeSchema = z.object({
  first_name: z.string().min(1),
  middle_name: z.string().optional().nullable(),
  last_name: z.string().min(1),
  position: z.string().optional().nullable(),
  employee_type: z.enum(EMPLOYEE_TYPE),
  status: z.enum(EMPLOYEE_STATUS).default("ACTIVE"),
  contact_number: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  branch_id: z.string().min(1),

  birthday: dateOrNull,
  date_hired: dateOrNull,
  address: z.string().optional().nullable(),
  tin: z.string().optional().nullable(),
  sss_number: z.string().optional().nullable(),
  philhealth_number: z.string().optional().nullable(),
  pagibig_number: z.string().optional().nullable(),
  emergency_contact_name: z.string().optional().nullable(),
  emergency_contact_number: z.string().optional().nullable(),

  salary_type: z.enum(SALARY_TYPE).default("DAILY_RATE"),
  worker_type: z.enum(WORKER_TYPE).default("REGULAR_WORKER"),
  declaration_status: z.enum(DECLARATION_STATUS).default("DECLARED"),
  default_daily_rate: z.coerce.number().optional().nullable(),
  default_monthly_salary: z.coerce.number().optional().nullable(),
  default_auction_rate: z.coerce.number().optional().nullable(),
  default_container_rate: z.coerce.number().optional().nullable(),
  default_ot_hour_rate: z.coerce.number().optional().nullable(),
  default_ot_minute_rate: z.coerce.number().optional().nullable(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = createEmployeeSchema.extend({
  status: z.enum(EMPLOYEE_STATUS),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
