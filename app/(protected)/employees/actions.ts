"use server";

import {
  authorizeAction,
  runWithUserContext,
  runWithBranchContext,
} from "@/app/lib/protected-action";
import { CreateEmployeeController } from "src/controllers/employees/create-employee.controller";
import { UpdateEmployeeController } from "src/controllers/employees/update-employee.controller";
import { GetEmployeesController } from "src/controllers/employees/get-employees.controller";
import { DeleteEmployeeController } from "src/controllers/employees/delete-employee.controller";
import {
  GetEmploymentEventsController,
  AddEmploymentEventController,
  DeleteEmploymentEventController,
} from "src/controllers/employment-events/employment-events.controller";
import prisma from "@/app/lib/prisma/prisma";
import { ok, err } from "src/entities/models/Result";

export const getEmployees = async (branch_id?: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetEmployeesController(branch_id),
  );
};

export const createEmployee = async (formData: FormData) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"],
  });
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  return await runWithUserContext(auth.value, async () =>
    CreateEmployeeController(data),
  );
};

export const getExpenseDescriptions = async (branch_id?: string) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"],
  });
  if (!auth.ok) return auth;

  try {
    const grouped = await prisma.expenses.groupBy({
      by: ["remarks"],
      where: {
        purpose: "EXPENSE",
        deleted_at: null,
        ...(branch_id ? { branch_id } : {}),
      },
      _count: { remarks: true },
      orderBy: { _count: { remarks: "desc" } },
    });

    return ok(
      grouped.map((g) => ({
        remarks: g.remarks,
        count: g._count.remarks,
      })),
    );
  } catch {
    return err({ message: "Server Error", cause: "Failed to fetch expense descriptions" });
  }
};

export const updateEmployee = async (
  employee_id: string,
  formData: FormData,
) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"],
  });
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  return await runWithUserContext(auth.value, async () =>
    UpdateEmployeeController(employee_id, data),
  );
};

export const deleteEmployee = async (employee_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => DeleteEmployeeController(employee_id));
};

export const getEmploymentEvents = async (employee_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithBranchContext(auth.value, () => GetEmploymentEventsController(employee_id));
};

export const addEmploymentEvent = async (formData: FormData) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  const data = Object.fromEntries(formData.entries());
  return runWithUserContext(auth.value, () => AddEmploymentEventController(data));
};

export const deleteEmploymentEvent = async (event_id: string) => {
  const auth = await authorizeAction({ allowedRoles: ["OWNER", "SUPER_ADMIN", "CASHIER"] });
  if (!auth.ok) return auth;
  return runWithUserContext(auth.value, () => DeleteEmploymentEventController(event_id));
};
