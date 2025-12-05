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
      return await prisma.bidders.findMany({
        include: { branch: true },
        orderBy: { bidder_number: "asc" },
      });
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
};
