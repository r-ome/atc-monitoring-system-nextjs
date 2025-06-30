import { ISupplierRepository } from "src/application/repositories/suppliers.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { isPrismaError, isPrismaValidationError } from "prisma/error-handler";

export const SupplierRepository: ISupplierRepository = {
  getSupplierBySupplierId: async (supplier_id) => {
    try {
      return await prisma.suppliers.findFirst({
        where: { supplier_id },
        include: { containers: { include: { inventories: true } } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting Supplier!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getSupplierBySupplierCode: async (supplier_code) => {
    try {
      return await prisma.suppliers.findFirst({
        where: { supplier_code },
        include: { containers: { include: { inventories: true } } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting Supplier!");
      }

      throw error;
    }
  },
  createSupplier: async (input) => {
    try {
      const created = await prisma.suppliers.create({
        data: {
          name: input.name,
          supplier_code: input.supplier_code,
          japanese_name: input.japanese_name,
          commission: input.commission,
          sales_remittance_account: input.sales_remittance_account,
          shipper: input.shipper,
          email: input.email,
          contact_number: input.contact_number,
        },
      });

      if (!created) {
        throw new DatabaseOperationError("Error creating a new Supplier!");
      }

      return created;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating supplier", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getSuppliers: async () => {
    try {
      return await prisma.suppliers.findMany({ orderBy: { name: "asc" } });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting suppliers!");
      }

      throw error;
    }
  },
  getSupplierContainers: async (supplier_id) => {
    try {
      return await prisma.suppliers.findFirst({
        where: { supplier_id },
        include: { containers: { include: { inventories: true } } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error getting Supplier's Containers",
          { cause: error.message }
        );
      }

      throw error;
    }
  },
  updateSupplier: async (supplier_id, data) => {
    try {
      const updated = await prisma.suppliers.update({
        where: { supplier_id },
        data: {
          name: data.name,
          supplier_code: data.supplier_code,
          japanese_name: data.japanese_name,
          commission: data.commission,
          sales_remittance_account: data.sales_remittance_account,
          shipper: data.shipper,
          email: data.email,
          contact_number: data.contact_number,
        },
      });

      if (!updated) {
        throw new NotFoundError("Supplier not found!");
      }

      return updated;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating Supplier!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
