import { withBidderActivity } from "./bidder-activity";
import { buildTenantWhere } from "@/app/lib/prisma/tenant-where";
import { IBidderBanHistoryRepository } from "src/application/repositories/bidder-ban-history.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const BidderBanHistoryRepository: IBidderBanHistoryRepository = {
  create: async (bidder_id, input) => {
    try {
      return await withBidderActivity(prisma, { bidderIds: [bidder_id] }, async (tx) => {
        const history = await tx.bidder_ban_histories.create({
          data: { bidder_id, remarks: input.remarks },
        });

        await tx.bidders.update({
          where: { bidder_id },
          data: { status: "BANNED" },
        });

        return history;
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating ban history!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  delete: async (bidder_ban_history_id) => {
    try {
      return await withBidderActivity(prisma, { banIds: [bidder_ban_history_id] }, async (tx) => {
        await tx.bidder_ban_histories.delete({
          where: { bidder_ban_history_id, bidder: buildTenantWhere("bidders", {}) },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting ban history!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
