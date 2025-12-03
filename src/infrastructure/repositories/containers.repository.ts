import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IContainerRepository } from "src/application/repositories/containers.repository.interface";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { ContainerInsertSchema } from "src/entities/models/Container";

export const ContainerRepository: IContainerRepository = {
  getContainerById: async (container_id: string) => {
    try {
      return await prisma.containers.findFirst({
        where: { container_id },
        include: {
          branch: true,
          inventories: {
            include: {
              auctions_inventories: {
                include: { auction_bidder: { include: { bidder: true } } },
                orderBy: { created_at: "desc" },
              },
            },
          },
          supplier: true,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting Container!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getContainerByBarcode: async (barcode: string) => {
    try {
      return await prisma.containers.findFirst({
        where: { barcode },
        include: {
          branch: true,
          inventories: {
            include: {
              auctions_inventories: {
                include: { auction_bidder: { include: { bidder: true } } },
                orderBy: { created_at: "desc" },
              },
            },
          },
          supplier: true,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting Container!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getContainers: async () => {
    try {
      return await prisma.containers.findMany({
        include: { branch: true, inventories: true, supplier: true },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting Containers!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  createContainer: async (container: ContainerInsertSchema) => {
    try {
      const created = await prisma.containers.create({
        data: {
          supplier_id: container.supplier_id,
          branch_id: container.branch_id,
          barcode: container.barcode,
          bill_of_lading_number: container.bill_of_lading_number,
          container_number: container.container_number,
          arrival_date: container.arrival_date,
          auction_end_date: container.auction_end_date,
          due_date: container.due_date,
          gross_weight: container.gross_weight,
          auction_or_sell: "AUCTION",
          status: "UNPAID",
        },
      });

      if (!created) {
        throw new Error("Failed to created Container");
      }

      return created;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating Container", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getInventoriesByContainerBarcode: async (barcode) => {
    try {
      const container = await prisma.containers.findFirst({
        where: { barcode },
        include: { inventories: { orderBy: { barcode: "asc" } } },
      });

      if (!container) {
        throw new NotFoundError("Container not found!");
      }

      return container;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error getting inventories by Container Barcode",
          { cause: error.message }
        );
      }

      throw error;
    }
  },
  uploadInventoryFile: async (rows) => {
    try {
      return await prisma.inventories.createMany({
        data: rows,
        skipDuplicates: true,
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error uploading inventories", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  updateContainer: async (container_id, data) => {
    try {
      return await prisma.containers.update({
        where: { container_id },
        include: { supplier: true, branch: true },
        data: {
          supplier_id: data.supplier_id,
          branch_id: data.branch_id,
          barcode: data.barcode,
          bill_of_lading_number: data.bill_of_lading_number,
          container_number: data.container_number,
          arrival_date: data.arrival_date,
          auction_end_date: data.auction_end_date,
          due_date: data.due_date,
          gross_weight: data.gross_weight,
          auction_or_sell: data.auction_or_sell,
          // status: data.status
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating container!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  deleteContainer: async (container_id) => {
    try {
      const deleted = await prisma.containers.delete({
        where: { container_id },
      });
      throw new Error("woops");
      return deleted;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting container!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
