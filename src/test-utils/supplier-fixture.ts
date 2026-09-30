import type { TestContext } from "node:test";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  ActivityLogRepository,
  SupplierRepository,
  UserRepository,
} from "src/infrastructure/di/repositories";
import type { CreateActivityLogInput } from "src/entities/models/ActivityLog";
import type {
  CreateSupplierInput,
  SupplierRow,
  UpdateSupplierInput,
} from "src/entities/models/Supplier";
import type { UserRole, UserWithBranchRow } from "src/entities/models/User";
import { patchMethod } from "./patch";

export const SUPPLIER_ROW: SupplierRow = {
  supplier_id: "supplier-1",
  name: "Example Supplier",
  supplier_code: "32-04",
  japanese_name: "Japanese Name",
  commission: "25",
  sales_remittance_account: "Original Account",
  shipper: "Original Shipper",
  email: "supplier@example.com",
  contact_number: "09123456789",
  created_at: new Date("2026-09-01T00:00:00.000Z"),
  updated_at: new Date("2026-09-01T00:00:00.000Z"),
  deleted_at: null,
};

export const SUPPLIER_INPUT: CreateSupplierInput = {
  name: SUPPLIER_ROW.name,
  supplier_code: SUPPLIER_ROW.supplier_code,
  japanese_name: SUPPLIER_ROW.japanese_name,
  commission: SUPPLIER_ROW.commission,
  sales_remittance_account: SUPPLIER_ROW.sales_remittance_account,
  shipper: SUPPLIER_ROW.shipper,
  email: SUPPLIER_ROW.email,
  contact_number: SUPPLIER_ROW.contact_number,
};

export function supplierFormData(input: CreateSupplierInput = SUPPLIER_INPUT) {
  const form = new FormData();
  for (const [key, value] of Object.entries(input)) {
    if (value != null) form.set(key, value);
  }
  return form;
}

// Stub authentication and persistence boundaries. Keep authorization,
// controllers, request context, and activity logging real.
export async function setupSupplierTest(
  context: TestContext,
  role: UserRole = "CASHIER",
) {
  const restorers: Array<() => void> = [];
  context.after(() => {
    while (restorers.length) restorers.pop()?.();
  });

  function replace<TObject extends object, TKey extends keyof TObject>(
    target: TObject,
    key: TKey,
    replacement: TObject[TKey],
  ) {
    restorers.push(patchMethod(target, key, replacement));
  }

  const user: UserWithBranchRow = {
    user_id: "user-1",
    name: "Supplier Operator",
    username: "supplier-operator",
    role,
    branch_id: "branch-1",
    branch: { branch_id: "branch-1", name: "BIÑAN" },
    last_activity_at: new Date(),
    created_at: SUPPLIER_ROW.created_at,
    updated_at: SUPPLIER_ROW.updated_at,
  };
  const logs: CreateActivityLogInput[] = [];
  const creates: CreateSupplierInput[] = [];
  const updates: Array<{ supplier_id: string; data: UpdateSupplierInput }> = [];
  const reads: Array<{ field: "id" | "code"; value: string }> = [];

  const authModule = await import("@/app/lib/auth");
  replace(authModule, "requireUser", async () => ({
    id: user.user_id,
    name: user.name,
    username: user.username,
    role: user.role,
    branch: user.branch,
  }));
  const loggerModule = await import("@/app/lib/logger");
  replace(loggerModule, "logger", () => {});
  replace(UserRepository, "getUserByUsername", async () => user);
  replace(SupplierRepository, "createSupplier", async (data) => {
    creates.push(data);
    return { ...SUPPLIER_ROW, ...data };
  });
  replace(SupplierRepository, "updateSupplier", async (supplier_id, data) => {
    updates.push({ supplier_id, data });
    return { ...SUPPLIER_ROW, ...data, supplier_id };
  });
  replace(SupplierRepository, "getSupplierBySupplierId", async (supplier_id) => {
    reads.push({ field: "id", value: supplier_id });
    return supplier_id === SUPPLIER_ROW.supplier_id
      ? { ...SUPPLIER_ROW, containers: [] }
      : null;
  });
  replace(SupplierRepository, "getSupplierBySupplierCode", async (supplier_code) => {
    reads.push({ field: "code", value: supplier_code });
    return supplier_code === SUPPLIER_ROW.supplier_code
      ? { ...SUPPLIER_ROW, containers: [] }
      : null;
  });
  replace(ActivityLogRepository, "createActivityLog", async (input) => {
    logs.push(input);
    return {
      ...input,
      activity_log_id: `activity-${logs.length}`,
      created_at: new Date(),
    };
  });

  function runAsUser<T>(callback: () => Promise<T>) {
    return RequestContext.run(
      {
        username: user.username,
        branch_id: user.branch.branch_id,
        branch_name: user.branch.name,
      },
      callback,
    );
  }

  return { user, logs, creates, updates, reads, replace, runAsUser };
}
