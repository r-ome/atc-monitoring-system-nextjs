"use server";

import { authorizeAction, runWithUserContext, runWithBranchContext } from "@/app/lib/protected-action";
import {
  ListPayrollPeriodsController,
  CreatePayrollPeriodController,
  PostPayrollPeriodController,
  VoidPayrollPeriodController,
  GetPayrollPeriodController,
} from "src/controllers/payroll-periods/payroll-periods.controller";
import {
  ListPayrollEntriesController,
  UpsertPayrollEntryController,
  DeletePayrollEntryController,
  BulkGenerateEntriesController,
  MarkEntryPaidController,
  GetPayrollEntryController,
} from "src/controllers/payroll-entries/payroll-entries.controller";
import {
  GetEmploymentEventsController,
  AddEmploymentEventController,
  DeleteEmploymentEventController,
} from "src/controllers/employment-events/employment-events.controller";
import {
  PreviewRegularUploadController,
  RevalidateRegularUploadController,
  ConfirmRegularUploadController,
} from "src/controllers/payroll-uploads/payroll-uploads.controller";
import type { RegularUploadRowInput } from "src/application/payroll/upload-regular-pipeline";
import type { BulkUpsertUploadRow } from "src/application/repositories/payroll-entries.repository.interface";

// ---- Payroll Periods ----

export const getPayrollPeriods = async (branch_id?: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  const isAdmin = ["OWNER", "SUPER_ADMIN"].includes(auth.value.role);
  return runWithBranchContext(auth.value, () =>
    ListPayrollPeriodsController(isAdmin ? branch_id : (branch_id ?? auth.value.branch.branch_id)),
  );
};

export const getPayrollPeriod = async (payroll_period_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithBranchContext(auth.value, () => GetPayrollPeriodController(payroll_period_id));
};

export const createPayrollPeriod = async (formData: FormData) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  const data = Object.fromEntries(formData.entries());
  return runWithUserContext(auth.value, () => CreatePayrollPeriodController(data));
};

export const postPayrollPeriod = async (payroll_period_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => PostPayrollPeriodController(payroll_period_id));
};

export const voidPayrollPeriod = async (payroll_period_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => VoidPayrollPeriodController(payroll_period_id));
};

// ---- Payroll Entries ----

export const getPayrollEntries = async (payroll_period_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithBranchContext(auth.value, () => ListPayrollEntriesController(payroll_period_id));
};

export const getPayrollEntry = async (payroll_entry_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithBranchContext(auth.value, () => GetPayrollEntryController(payroll_entry_id));
};

export const upsertPayrollEntry = async (data: Record<string, unknown>) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => UpsertPayrollEntryController(data));
};

export const deletePayrollEntry = async (payroll_entry_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => DeletePayrollEntryController(payroll_entry_id));
};

export const bulkGenerateEntries = async (payroll_period_id: string, branch_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => BulkGenerateEntriesController(payroll_period_id, branch_id));
};

export const markEntryPaid = async (payroll_entry_id: string, pay_date: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () =>
    MarkEntryPaidController(payroll_entry_id, auth.value.branch.branch_id, pay_date),
  );
};

// ---- Auction days helper ----

export const getAuctionDatesForPeriod = async (payroll_period_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  const { GetAuctionDatesForPeriodController } = await import(
    "src/controllers/payroll-uploads/auction-dates.controller"
  );
  return runWithUserContext(auth.value, () =>
    GetAuctionDatesForPeriodController(payroll_period_id),
  );
};

// ---- Regular Sheet Upload ----

export const previewRegularUpload = async (formData: FormData) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => PreviewRegularUploadController(formData));
};

export const revalidateRegularUpload = async (
  payroll_period_id: string,
  rows: RegularUploadRowInput[],
) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () =>
    RevalidateRegularUploadController(payroll_period_id, rows),
  );
};

export const confirmRegularUpload = async (
  payroll_period_id: string,
  rows: BulkUpsertUploadRow[],
) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () =>
    ConfirmRegularUploadController(payroll_period_id, rows),
  );
};

// ---- Employment Events ----

export const getEmploymentEvents = async (employee_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN"] });
  if (!auth.ok) return auth;
  return runWithBranchContext(auth.value, () => GetEmploymentEventsController(employee_id));
};

export const addEmploymentEvent = async (formData: FormData) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN"] });
  if (!auth.ok) return auth;
  const data = Object.fromEntries(formData.entries());
  return runWithUserContext(auth.value, () => AddEmploymentEventController(data));
};

export const deleteEmploymentEvent = async (event_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => DeleteEmploymentEventController(event_id));
};
