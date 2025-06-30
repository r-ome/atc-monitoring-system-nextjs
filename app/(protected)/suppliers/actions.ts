"use server";

import { UpdateSupplierController } from "src/controllers/suppliers/update-suppliers.controllers";
import { CreateSupplierController } from "src/controllers/suppliers/create-supplier.controller";
import { getSupplierBySupplierCodeController } from "src/controllers/suppliers/get-supplier-by-supplier-code.controller";
import { GetSuppliersController } from "src/controllers/suppliers/get-suppliers.controllers";

export const getSupplierBySupplierCode = async (supplier_code: string) => {
  return await getSupplierBySupplierCodeController(supplier_code);
};

export const createSupplier = async (form_data: FormData) => {
  const data = Object.fromEntries(form_data.entries());
  return await CreateSupplierController(data);
};

export const getSuppliers = async () => {
  return await GetSuppliersController();
};

export const updateSupplier = async (
  supplier_id: string,
  form_data: FormData
) => {
  const input = Object.fromEntries(form_data.entries());
  return await UpdateSupplierController(supplier_id, input);
};
