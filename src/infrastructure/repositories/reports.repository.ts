import { IReportsRepository } from "src/application/repositories/reports.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

function parseDateRange(date: string) {
  const parts = date.split("-").map(Number);
  // "year" → full year, "year-month" → full month
  if (parts.length === 1) {
    const [year] = parts;
    return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
  }
  const [year, month] = parts;
  return { start: new Date(year, month, 1), end: new Date(year, month + 1, 1) };
}

function handleError(context: string, error: unknown): never {
  if (isPrismaError(error) || isPrismaValidationError(error)) {
    throw new DatabaseOperationError(context, {
      cause: (error as Error).message,
    });
  }
  throw error;
}

export const ReportsRepository: IReportsRepository = {
  getTotalSales: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      return await prisma.auctions.findMany({
        include: {
          branch: true,
          registered_bidders: {
            include: { auctions_inventories: true },
          },
        },
        where: { branch_id, created_at: { gte: start, lt: end } },
        orderBy: { created_at: "asc" },
      });
    } catch (error) {
      handleError("Error getting total sales", error);
    }
  },

  getTotalExpenses: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      return await prisma.expenses.findMany({
        include: { branch: true },
        where: { branch_id, created_at: { gte: start, lt: end } },
      });
    } catch (error) {
      handleError("Error getting total expenses", error);
    }
  },

  getPaymentMethodBreakdown: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      return await prisma.payments.findMany({
        include: {
          payment_method: true,
          receipt: {
            include: {
              auction_bidder: {
                include: { auctions: { include: { branch: true } } },
              },
            },
          },
        },
        where: {
          created_at: { gte: start, lt: end },
          receipt: {
            auction_bidder: { auctions: { branch_id } },
          },
        },
        orderBy: { created_at: "asc" },
      });
    } catch (error) {
      handleError("Error getting payment method breakdown", error);
    }
  },

  getDailyCashFlowPayments: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      return await prisma.receipt_records.findMany({
        include: {
          payments: { include: { payment_method: true } },
          auction_bidder: { include: { auctions: true } },
        },
        where: {
          created_at: { gte: start, lt: end },
          auction_bidder: { auctions: { branch_id } },
        },
        orderBy: { created_at: "asc" },
      });
    } catch (error) {
      handleError("Error getting daily cash flow payments", error);
    }
  },

  getBiddersWithAuctions: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      return await prisma.bidders.findMany({
        include: {
          branch: true,
          auctions_joined: {
            include: {
              auctions: true,
              auctions_inventories: true,
              receipt_records: { include: { payments: true } },
            },
            where: { auctions: { created_at: { gte: start, lt: end }, branch_id } },
          },
        },
        where: {
          branch_id,
          auctions_joined: {
            some: { auctions: { created_at: { gte: start, lt: end }, branch_id } },
          },
        },
        orderBy: { bidder_number: "asc" },
      });
    } catch (error) {
      handleError("Error getting bidders with auctions", error);
    }
  },

  getAuctionInventoriesForSellThrough: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      return await prisma.auctions_inventories.findMany({
        include: {
          auction_bidder: { include: { auctions: true } },
          inventory: { include: { container: { include: { supplier: true } } } },
        },
        where: {
          auction_bidder: { auctions: { branch_id, created_at: { gte: start, lt: end } } },
        },
        orderBy: { auction_date: "asc" },
      });
    } catch (error) {
      handleError("Error getting sell-through data", error);
    }
  },

  getRefundCancellationItems: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      return await prisma.auctions_inventories.findMany({
        include: {
          auction_bidder: { include: { bidder: true, auctions: true } },
          inventory: true,
          histories: {
            include: {
              receipt: {
                include: {
                  auction_bidder: { include: { bidder: true } },
                },
              },
            },
            orderBy: { created_at: "asc" },
          },
        },
        where: {
          status: { in: ["REFUNDED", "CANCELLED"] },
          auction_bidder: { auctions: { branch_id, created_at: { gte: start, lt: end } } },
        },
        orderBy: { auction_date: "asc" },
      });
    } catch (error) {
      handleError("Error getting refund/cancellation items", error);
    }
  },
};
