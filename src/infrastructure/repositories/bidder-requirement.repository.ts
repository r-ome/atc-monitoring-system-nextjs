import { withBidderActivity } from "./bidder-activity";
import { buildTenantWhere } from "@/app/lib/prisma/tenant-where";
import { IBidderRequirementRepository } from "src/application/repositories/bidder-requirement.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const BidderRequirementRepository: IBidderRequirementRepository = {
  create: async (bidder_id, input) => {
    try {
      return await withBidderActivity(prisma, { bidderIds: [bidder_id] }, async (tx) => {
        return await tx.bidder_requirements.create({
          data: {
            bidder_id,
            name: input.name,
            url: input.url ?? null,
            validity_date: input.validity_date ?? null,
          },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating bidder requirement!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  update: async (requirement_id, input) => {
    try {
      return await withBidderActivity(prisma, { requirementIds: [requirement_id] }, async (tx) => {
        return await tx.bidder_requirements.update({
          where: { requirement_id, bidders: buildTenantWhere("bidders", {}) },
          data: {
            name: input.name,
            url: input.url ?? null,
            validity_date: input.validity_date ?? null,
          },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating bidder requirement!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  delete: async (requirement_id) => {
    try {
      return await withBidderActivity(prisma, { requirementIds: [requirement_id] }, async (tx) => {
        await tx.bidder_requirements.delete({ where: { requirement_id, bidders: buildTenantWhere("bidders", {}) } });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting bidder requirement!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
