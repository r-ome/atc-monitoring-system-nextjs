"use server";

import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { UpdateSupplierController } from "src/controllers/suppliers/update-supplier.controller";
import { CreateSupplierController } from "src/controllers/suppliers/create-supplier.controller";
import { GetSupplierBySupplierCodeController } from "src/controllers/suppliers/get-supplier-by-supplier-code.controller";
import { GetSuppliersController } from "src/controllers/suppliers/get-suppliers.controller";

export const getSupplierBySupplierCode = async (supplier_code: string) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetSupplierBySupplierCodeController(supplier_code),
  );
};

export const createSupplier = async (form_data: FormData) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  const data = Object.fromEntries(form_data.entries());
  return await runWithUserContext(auth.value, async () =>
    CreateSupplierController(data),
  );
};

export const getSuppliers = async () => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetSuppliersController(),
  );
};

export const updateSupplier = async (
  supplier_id: string,
  form_data: FormData
) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  const input = Object.fromEntries(form_data.entries());
  return await runWithUserContext(auth.value, async () =>
    UpdateSupplierController(supplier_id, input),
  );
};
