import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { DatabaseOperationError } from "src/entities/errors/common";
import { IStatisticsRepository } from "src/application/repositories/statistics.repository.interface";
import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";

export const StatisticsRepository: IStatisticsRepository = {
  getBidderBirthdates: async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;

      const bidder_with_birthdates = await prisma.$queryRaw`
          SELECT 
            b.bidder_id,
            b.first_name,
            b.last_name,
            b.bidder_number,
            b.birthdate,
            TIMESTAMPDIFF(YEAR, b.birthdate, CURDATE()) AS age,
            ab.created_at AS last_auction_date
          FROM bidders b
          LEFT JOIN auctions_bidders ab
            ON ab.bidder_id = b.bidder_id
            AND ab.created_at = (
              SELECT MAX(created_at)
              FROM auctions_bidders
              WHERE bidder_id = b.bidder_id
            )
          WHERE MONTH(b.birthdate) = ${month}
          ORDER BY DAY(b.birthdate);
        `;

      return bidder_with_birthdates as BiddersWithBirthdatesAndRecentAuctionSchema[];
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting bidders!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getContainersDueDate: async () => {
    try {
      const now = new Date();
      const containers = await prisma.containers.findMany({
        where: { due_date: { not: null, gte: now } },
        orderBy: { due_date: "asc" },
      });

      return containers;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting containers!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getUnpaidBidders: async () => {
    try {
      const unpaid_bidders = await prisma.auctions_bidders.findMany({
        where: { balance: { gt: 0 } },
        include: { bidder: true, auctions_inventories: true },
        orderBy: { created_at: "asc" },
      });

      return unpaid_bidders;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting unpaid bidders!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
