import prisma, { tenantQuery } from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { DatabaseOperationError } from "src/entities/errors/common";
import { IStatisticsRepository } from "src/application/repositories/statistics.repository.interface";
import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";
import { AuctionsStatisticsSchema } from "src/entities/models/Statistics";

export const StatisticsRepository: IStatisticsRepository = {
  getBidderBirthdates: async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;

      const bidder_with_birthdates = await tenantQuery({
        sql: `
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
        `,
        table: "b",
      });

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
  getAuctionsStatistics: async () => {
    try {
      const auctions = await tenantQuery({
        sql: `
        SELECT
          a.auction_id,
          a.created_at AS auction_date,
          CAST(COUNT(DISTINCT ab.auction_bidder_id) AS SIGNED) AS total_registered_bidders,
          CAST(COUNT(ai.auction_inventory_id) AS SIGNED) AS total_items,
          CAST(SUM(CASE WHEN ai.status = 'CANCELLED' THEN 1 ELSE 0 END) AS SIGNED) AS total_cancelled_items,
          CAST(SUM(CASE WHEN ai.status = 'REFUNDED' THEN 1 ELSE 0 END) AS SIGNED) AS total_refunded_items,
          CAST(COUNT(DISTINCT CASE 
              WHEN ab.balance > 0 THEN ab.auction_bidder_id 
              ELSE NULL 
          END) AS SIGNED) AS total_bidders_with_balance,
          GROUP_CONCAT(DISTINCT c.barcode ORDER BY c.barcode SEPARATOR ', ') AS container_barcodes
        FROM auctions a
        LEFT JOIN auctions_bidders ab ON ab.auction_id = a.auction_id
        LEFT JOIN auctions_inventories ai ON ai.auction_bidder_id = ab.auction_bidder_id
        LEFT JOIN inventories i ON i.inventory_id = ai.inventory_id
        LEFT JOIN containers c ON c.container_id = i.container_id
        GROUP BY a.auction_id, a.created_at
        ORDER BY a.created_at DESC
      `,
        table: "a",
      });

      return auctions as AuctionsStatisticsSchema[];
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting auction statistics!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
