import { IBranchRepository } from "src/application/repositories/branches.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const BranchRepository: IBranchRepository = {
  getBranch: async (branch_id) => {
    try {
      return await prisma.branches.findUnique({ where: { branch_id } });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting branch", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getBranchByName: async (name) => {
    try {
      return await prisma.branches.findFirst({ where: { name } });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting branch", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getBranches: async () => {
    try {
      return await prisma.branches.findMany({
        where: { name: { not: "ALL" } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting branches", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  createBranch: async ({ name }) => {
    try {
      return await prisma.branches.create({ data: { name } });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating branch!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updateBranch: async (branch_id, input) => {
    try {
      return await prisma.branches.update({
        where: { branch_id },
        data: { name: input.name },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating Branch!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getBranchWithBidders: async (branch_id) => {
    try {
      const branch = await prisma.branches.findUnique({
        include: { bidders: true },
        where: { branch_id },
      });
      if (!branch) {
        throw new NotFoundError("Branch not found!");
      }
      return branch;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting Branch!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
