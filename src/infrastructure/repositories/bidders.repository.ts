import { isBidderActivityRecalculationEnabled, recalculateBidderActivity, withBidderActivity } from "./bidder-activity";
import { SUPER_ADMIN_BRANCH } from "@/app/lib/prisma/prisma";
import { getBidderActivityTime } from "src/entities/models/BidderActivity";
import { buildTenantWhere } from "@/app/lib/prisma/tenant-where";
import { IBidderRepository } from "src/application/repositories/bidders.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import {
  NotFoundError,
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { UpdateBidderInput } from "src/entities/models/Bidder";
import { payments_purpose } from "@prisma/client";

export const BidderRepository: IBidderRepository = {
  recalculateActivity: async (branch_id) => {
    if (!branch_id?.trim() || branch_id === SUPER_ADMIN_BRANCH) {
      throw new InputParseError("Select a valid bidder branch.");
    }
    if (!isBidderActivityRecalculationEnabled()) {
      throw new InputParseError("Bidder status recalculation is not enabled. Contact an administrator.");
    }
    return await withBidderActivity(prisma, {}, async (tx) => {
      const branch = await tx.branches.findFirst({
        where: { branch_id, deleted_at: null, name: { not: "ALL" } },
        select: { branch_id: true },
      });
      if (!branch) throw new InputParseError("Select a valid bidder branch.");
      return await recalculateBidderActivity(tx, branch_id);
    }, { timeout: 30_000 });
  },
  getBidder: async (bidder_id) => {
    try {
      const bidder = await prisma.bidders.findFirst({
        where: { bidder_id },
        include: {
          branch: true,
          auctions_joined: { include: { auctions_inventories: true } },
          requirements: true,
        },
      });

      if (!bidder) {
        throw new NotFoundError("Bidder not found!");
      }

      return bidder;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting bidder!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getBidderByBidderNumber: async (bidder_number, branch_name) => {
    try {
      const bidder = await prisma.bidders.findFirst({
        where: { bidder_number, branch: { name: branch_name } },
        include: {
          branch: true,
          auctions_joined: {
            include: {
              auctions: true,
              auctions_inventories: true,
              receipt_records: {
                where: { purpose: { notIn: [payments_purpose.REFUNDED, payments_purpose.LESS] } },
                include: { payments: true },
              },
            },
            orderBy: { auctions: { created_at: "desc" } },
          },
          requirements: true,
          ban_histories: { orderBy: { created_at: "desc" } },
        },
      });

      return bidder;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting bidder", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getBidders: async () => {
    try {
      const bidders = await prisma.bidders.findMany({
        include: {
          branch: true,
          auctions_joined: {
            select: { created_at: true },
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
        orderBy: { bidder_number: "asc" },
      });

      return bidders;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting bidders!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  createBidder: async (data) => {
    try {
      const created = await prisma.bidders.create({
        include: { branch: true },
        data: {
          bidder_number: data.bidder_number,
          first_name: data.first_name,
          middle_name: data.middle_name ?? null,
          last_name: data.last_name,
          address: data.address,
          tin_number: data.tin_number,
          store_name: data.store_name,
          service_charge: data.service_charge,
          registration_fee: data.registration_fee,
          contact_number: data.contact_number,
          branch_id: data.branch_id,
          status: "ACTIVE",
          last_activity_at: getBidderActivityTime(),
        },
      });

      return created;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating bidder!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updateBidder: async (bidder_id, data: UpdateBidderInput) => {
    try {
      return await withBidderActivity(prisma, { bidderIds: [bidder_id] }, async (tx) => {
        const updated = await tx.bidders.update({
          include: { branch: true },
          where: { bidder_id, ...buildTenantWhere("bidders", {}) },
          data: {
            bidder_number: data.bidder_number,
            first_name: data.first_name,
            middle_name: data.middle_name,
            last_name: data.last_name,
            birthdate: data.birthdate,
            contact_number: data.contact_number,
            registration_fee: data.registration_fee,
            service_charge: data.service_charge,
            branch_id: data.branch_id,
            payment_term: data.payment_term,
          },
        });

        return updated;
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating bidder!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  updateBidderStatus: async (bidder_id, status) => {
    try {
      return await withBidderActivity(prisma, { bidderIds: [bidder_id] }, async (tx) => {
        return await tx.bidders.update({
          include: { branch: true },
          where: { bidder_id, ...buildTenantWhere("bidders", {}) },
          data: { status },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating bidder status!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  uploadBidders: async (data) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const valid_bidders = data.filter((item) => item.isValid);

        return await tx.bidders.createMany({
          data: valid_bidders.map((item) => ({
            bidder_number: item.BIDDER_NUMBER,
            first_name: item.FIRST_NAME,
            middle_name: item.MIDDLE_NAME,
            last_name: item.LAST_NAME,
            registration_fee: parseInt(item.REGISTRATION_FEE, 10),
            service_charge: parseInt(item.SERVICE_CHARGE, 10),
            birthdate: item.BIRTHDATE === "" ? null : item.BIRTHDATE,
            contact_number: item.CONTACT_NUMBER,
            status: "ACTIVE",
            last_activity_at: getBidderActivityTime(),
            address: item.ADDRESS,
            tin_number: item.TIN_NUMBER,
            branch_id: item.branch_id,
          })),
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error uploading bidders!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
