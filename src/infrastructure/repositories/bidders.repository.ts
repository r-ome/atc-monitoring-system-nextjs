import { IBidderRepository } from "src/application/repositories/bidders.repository.interface";
import { BidderInsertSchema } from "src/entities/models/Bidder";
import prisma from "@/app/lib/prisma/prisma";
import {
  NotFoundError,
  DatabaseOperationError,
} from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const BidderRepository: IBidderRepository = {
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
          auctions_joined: { include: { auctions_inventories: true } },
          requirements: true,
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
          auctions_joined: { orderBy: { created_at: "desc" } },
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
  updateBidder: async (bidder_id, data: BidderInsertSchema) => {
    try {
      const updated = await prisma.bidders.update({
        include: { branch: true },
        where: { bidder_id },
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
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating bidder!", {
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
