import { Prisma } from "@prisma/client";
import { IReportsRepository } from "src/application/repositories/reports.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import {
  AuctionSalesSummaryRow,
  BidderReportRow,
  ExpenseSummaryDetailRow,
  ExpenseSummaryRow,
} from "src/entities/models/Report";

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

function toNumber(value: Prisma.Decimal | number | string | bigint | null) {
  if (value === null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value);
  return value.toNumber();
}

export const ReportsRepository: IReportsRepository = {
  getTotalSales: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      const rows = await prisma.$queryRaw<
        Array<{
          auction_id: string;
          created_at: Date;
          total_bidders: bigint | number;
          total_items: bigint | number;
          items_sold: bigint | number;
          total_sales: Prisma.Decimal | number | string | null;
          total_registration_fee: Prisma.Decimal | number | string | null;
          total_bidder_percentage_amount: Prisma.Decimal | number | string | null;
        }>
      >(Prisma.sql`
        SELECT
          a.auction_id,
          a.created_at,
          COALESCE(bidder_totals.total_bidders, 0) AS total_bidders,
          COALESCE(item_totals.total_items, 0) AS total_items,
          COALESCE(item_totals.items_sold, 0) AS items_sold,
          COALESCE(item_totals.total_sales, 0) AS total_sales,
          COALESCE(bidder_totals.total_registration_fee, 0) AS total_registration_fee,
          COALESCE(item_totals.total_bidder_percentage_amount, 0) AS total_bidder_percentage_amount
        FROM auctions a
        LEFT JOIN (
          SELECT
            ab.auction_id,
            COUNT(ab.auction_bidder_id) AS total_bidders,
            SUM(ab.registration_fee) AS total_registration_fee
          FROM auctions_bidders ab
          WHERE ab.deleted_at IS NULL
          GROUP BY ab.auction_id
        ) AS bidder_totals
          ON bidder_totals.auction_id = a.auction_id
        LEFT JOIN (
          SELECT
            ab.auction_id,
            COUNT(ai.auction_inventory_id) AS total_items,
            SUM(CASE WHEN ai.status = 'PAID' THEN 1 ELSE 0 END) AS items_sold,
            SUM(CASE WHEN ai.status = 'PAID' THEN ai.price ELSE 0 END) AS total_sales,
            SUM(
              CASE
                WHEN ai.status = 'PAID' THEN ai.price * (ab.service_charge / 100)
                ELSE 0
              END
            ) AS total_bidder_percentage_amount
          FROM auctions_inventories ai
          INNER JOIN auctions_bidders ab
            ON ab.auction_bidder_id = ai.auction_bidder_id
          WHERE ai.deleted_at IS NULL
            AND ab.deleted_at IS NULL
          GROUP BY ab.auction_id
        ) AS item_totals
          ON item_totals.auction_id = a.auction_id
        WHERE a.branch_id = ${branch_id}
          AND a.deleted_at IS NULL
          AND a.created_at >= ${start}
          AND a.created_at < ${end}
        ORDER BY a.created_at ASC
      `);

      return rows.map(
        (row): AuctionSalesSummaryRow => ({
          auction_id: row.auction_id,
          created_at: row.created_at,
          total_bidders: toNumber(row.total_bidders),
          total_items: toNumber(row.total_items),
          items_sold: toNumber(row.items_sold),
          total_sales: toNumber(row.total_sales),
          total_registration_fee: toNumber(row.total_registration_fee),
          total_bidder_percentage_amount: toNumber(row.total_bidder_percentage_amount),
        }),
      );
    } catch (error) {
      handleError("Error getting total sales", error);
    }
  },

  getTotalExpenses: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      const rows = await prisma.$queryRaw<
        Array<{
          created_at: Date;
          total_amount: Prisma.Decimal | number | string | null;
        }>
      >(Prisma.sql`
        SELECT
          e.created_at,
          SUM(e.amount) AS total_amount
        FROM expenses e
        WHERE e.deleted_at IS NULL
          AND e.branch_id = ${branch_id}
          AND e.purpose = 'EXPENSE'
          AND e.created_at >= ${start}
          AND e.created_at < ${end}
        GROUP BY e.created_at
        ORDER BY e.created_at ASC
      `);

      return rows.map(
        (row): ExpenseSummaryRow => ({
          created_at: row.created_at,
          total_amount: toNumber(row.total_amount),
        }),
      );
    } catch (error) {
      handleError("Error getting total expenses", error);
    }
  },

  getExpensesSummary: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      const rows = await prisma.$queryRaw<
        Array<{
          expense_id: string;
          created_at: Date;
          amount: Prisma.Decimal | number | string | null;
          purpose: "ADD_PETTY_CASH" | "EXPENSE";
          remarks: string;
        }>
      >(Prisma.sql`
        SELECT
          e.expense_id,
          e.created_at,
          e.amount,
          e.purpose,
          e.remarks
        FROM expenses e
        WHERE e.deleted_at IS NULL
          AND e.branch_id = ${branch_id}
          AND e.purpose = 'EXPENSE'
          AND e.created_at >= ${start}
          AND e.created_at < ${end}
        ORDER BY e.created_at DESC
      `);

      return rows.map(
        (row): ExpenseSummaryDetailRow => ({
          expense_id: row.expense_id,
          created_at: row.created_at,
          amount: toNumber(row.amount),
          purpose: row.purpose,
          remarks: row.remarks,
        }),
      );
    } catch (error) {
      handleError("Error getting expenses summary", error);
    }
  },

  getPaymentMethodBreakdown: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      const rows = await prisma.$queryRaw<
        Array<{
          payment_method_name: string | null;
          total_amount: Prisma.Decimal | number | string | null;
          transaction_count: bigint | number;
        }>
      >(Prisma.sql`
        SELECT
          COALESCE(pm.name, 'Unknown') AS payment_method_name,
          SUM(p.amount_paid) AS total_amount,
          COUNT(p.payment_id) AS transaction_count
        FROM payments p
        INNER JOIN receipt_records rr
          ON rr.receipt_id = p.receipt_id
        INNER JOIN auctions_bidders ab
          ON ab.auction_bidder_id = rr.auction_bidder_id
        INNER JOIN auctions a
          ON a.auction_id = ab.auction_id
        LEFT JOIN payment_methods pm
          ON pm.payment_method_id = p.payment_method_id
        WHERE p.deleted_at IS NULL
          AND rr.deleted_at IS NULL
          AND ab.deleted_at IS NULL
          AND a.deleted_at IS NULL
          AND a.branch_id = ${branch_id}
          AND p.created_at >= ${start}
          AND p.created_at < ${end}
        GROUP BY pm.name
        ORDER BY total_amount DESC
      `);

      return rows.map((row) => ({
        payment_method_name: row.payment_method_name ?? "Unknown",
        total_amount: toNumber(row.total_amount),
        transaction_count: toNumber(row.transaction_count),
      }));
    } catch (error) {
      handleError("Error getting payment method breakdown", error);
    }
  },

  getDailyCashFlowPayments: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      const rows = await prisma.$queryRaw<
        Array<{
          created_at: Date;
          purpose: string;
          total_amount: Prisma.Decimal | number | string | null;
        }>
      >(Prisma.sql`
        SELECT
          rr.created_at,
          rr.purpose,
          SUM(p.amount_paid) AS total_amount
        FROM receipt_records rr
        INNER JOIN auctions_bidders ab
          ON ab.auction_bidder_id = rr.auction_bidder_id
        INNER JOIN auctions a
          ON a.auction_id = ab.auction_id
        INNER JOIN payments p
          ON p.receipt_id = rr.receipt_id
        WHERE rr.deleted_at IS NULL
          AND ab.deleted_at IS NULL
          AND a.deleted_at IS NULL
          AND p.deleted_at IS NULL
          AND a.branch_id = ${branch_id}
          AND rr.created_at >= ${start}
          AND rr.created_at < ${end}
        GROUP BY rr.created_at, rr.purpose
        ORDER BY rr.created_at ASC
      `);

      return rows.map((row) => ({
        created_at: row.created_at,
        purpose: row.purpose,
        total_amount: toNumber(row.total_amount),
      }));
    } catch (error) {
      handleError("Error getting daily cash flow payments", error);
    }
  },

  getBiddersWithAuctions: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      const rows = await prisma.$queryRaw<
        Array<{
          bidder_id: string;
          bidder_number: string;
          first_name: string;
          last_name: string;
          status: string;
          auctions_attended: bigint | number;
          auctions_with_balance: bigint | number;
          items_won: bigint | number | null;
          total_spent: Prisma.Decimal | number | string | null;
          total_balance: Prisma.Decimal | number | string | null;
        }>
      >(Prisma.sql`
        SELECT
          b.bidder_id,
          b.bidder_number,
          b.first_name,
          b.last_name,
          b.status,
          bidder_totals.auctions_attended,
          bidder_totals.auctions_with_balance,
          COALESCE(item_totals.items_won, 0) AS items_won,
          COALESCE(item_totals.total_spent, 0) AS total_spent,
          bidder_totals.total_balance
        FROM bidders b
        INNER JOIN (
          SELECT
            ab.bidder_id,
            COUNT(ab.auction_bidder_id) AS auctions_attended,
            SUM(CASE WHEN ab.balance > 0 THEN 1 ELSE 0 END) AS auctions_with_balance,
            SUM(ab.balance) AS total_balance
          FROM auctions_bidders ab
          INNER JOIN auctions a
            ON a.auction_id = ab.auction_id
          WHERE ab.deleted_at IS NULL
            AND a.deleted_at IS NULL
            AND a.branch_id = ${branch_id}
            AND a.created_at >= ${start}
            AND a.created_at < ${end}
          GROUP BY ab.bidder_id
        ) AS bidder_totals
          ON bidder_totals.bidder_id = b.bidder_id
        LEFT JOIN (
          SELECT
            ab.bidder_id,
            SUM(CASE WHEN ai.status = 'PAID' THEN 1 ELSE 0 END) AS items_won,
            SUM(CASE WHEN ai.status = 'PAID' THEN ai.price ELSE 0 END) AS total_spent
          FROM auctions_inventories ai
          INNER JOIN auctions_bidders ab
            ON ab.auction_bidder_id = ai.auction_bidder_id
          INNER JOIN auctions a
            ON a.auction_id = ab.auction_id
          WHERE ai.deleted_at IS NULL
            AND ab.deleted_at IS NULL
            AND a.deleted_at IS NULL
            AND a.branch_id = ${branch_id}
            AND a.created_at >= ${start}
            AND a.created_at < ${end}
          GROUP BY ab.bidder_id
        ) AS item_totals
          ON item_totals.bidder_id = b.bidder_id
        WHERE b.branch_id = ${branch_id}
          AND b.deleted_at IS NULL
        ORDER BY b.bidder_number ASC
      `);

      return rows.map(
        (row): BidderReportRow => ({
          bidder_id: row.bidder_id,
          bidder_number: row.bidder_number,
          first_name: row.first_name,
          last_name: row.last_name,
          status: row.status,
          auctions_attended: toNumber(row.auctions_attended),
          auctions_with_balance: toNumber(row.auctions_with_balance),
          items_won: toNumber(row.items_won),
          total_spent: toNumber(row.total_spent),
          total_balance: toNumber(row.total_balance),
        }),
      );
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

  getSupplierRevenueSummary: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      const rows = await prisma.$queryRaw<
        Array<{
          supplier_name: string;
          supplier_code: string;
          container_count: bigint | number;
          items_sold: bigint | number;
          total_revenue: Prisma.Decimal | number | string | null;
        }>
      >(Prisma.sql`
        SELECT
          s.name AS supplier_name,
          s.supplier_code,
          COUNT(DISTINCT c.container_id) AS container_count,
          COUNT(ai.auction_inventory_id) AS items_sold,
          COALESCE(SUM(ai.price), 0) AS total_revenue
        FROM suppliers s
        INNER JOIN containers c
          ON c.supplier_id = s.supplier_id
          AND c.branch_id = ${branch_id}
          AND c.deleted_at IS NULL
        LEFT JOIN inventories i
          ON i.container_id = c.container_id
          AND i.deleted_at IS NULL
        LEFT JOIN auctions_inventories ai
          ON ai.inventory_id = i.inventory_id
          AND ai.status = 'PAID'
          AND ai.deleted_at IS NULL
          AND ai.auction_date >= ${start}
          AND ai.auction_date < ${end}
        WHERE s.deleted_at IS NULL
        GROUP BY s.supplier_id, s.name, s.supplier_code
        ORDER BY s.name ASC
      `);

      return rows.map((row) => ({
        supplier_name: row.supplier_name,
        supplier_code: row.supplier_code,
        container_count:
          typeof row.container_count === "bigint"
            ? Number(row.container_count)
            : row.container_count,
        items_sold:
          typeof row.items_sold === "bigint"
            ? Number(row.items_sold)
            : row.items_sold,
        total_revenue: toNumber(row.total_revenue),
      }));
    } catch (error) {
      handleError("Error getting supplier revenue summary", error);
    }
  },

  getContainerStatusOverview: async (branch_id) => {
    try {
      const rows = await prisma.$queryRaw<
        Array<{
          barcode: string;
          container_number: string | null;
          supplier_name: string;
          status: "PAID" | "UNPAID";
          arrival_date: Date | null;
          due_date: Date | null;
          duties_and_taxes: Prisma.Decimal | number | string | null;
          total_items: bigint | number;
          paid_items: Prisma.Decimal | bigint | number | string | null;
        }>
      >(Prisma.sql`
        SELECT
          c.barcode,
          c.container_number,
          s.name AS supplier_name,
          c.status,
          c.arrival_date,
          c.due_date,
          c.duties_and_taxes,
          COUNT(i.inventory_id) AS total_items,
          COALESCE(SUM(CASE WHEN ai.status = 'PAID' THEN 1 ELSE 0 END), 0) AS paid_items
        FROM containers c
        INNER JOIN suppliers s
          ON s.supplier_id = c.supplier_id
        LEFT JOIN inventories i
          ON i.container_id = c.container_id
          AND i.deleted_at IS NULL
        LEFT JOIN auctions_inventories ai
          ON ai.inventory_id = i.inventory_id
          AND ai.deleted_at IS NULL
        WHERE c.branch_id = ${branch_id}
          AND c.deleted_at IS NULL
        GROUP BY
          c.container_id,
          c.barcode,
          c.container_number,
          s.name,
          c.status,
          c.arrival_date,
          c.due_date,
          c.duties_and_taxes
        ORDER BY c.due_date ASC, c.arrival_date ASC
      `);

      return rows.map((row) => ({
        barcode: row.barcode,
        container_number: row.container_number,
        supplier_name: row.supplier_name,
        status: row.status,
        arrival_date: row.arrival_date,
        due_date: row.due_date,
        duties_and_taxes: toNumber(row.duties_and_taxes),
        total_items:
          typeof row.total_items === "bigint"
            ? Number(row.total_items)
            : row.total_items,
        paid_items:
          toNumber(row.paid_items),
      }));
    } catch (error) {
      handleError("Error getting container status overview", error);
    }
  },

  getPriceComparisonByMonth: async (branch_id, date) => {
    try {
      const { start, end } = parseDateRange(date);
      return await prisma.inventories.findMany({
        where: {
          is_bought_item: { not: null },
          auctions_inventory: {
            auction_bidder: {
              auctions: { branch_id, created_at: { gte: start, lt: end } },
            },
          },
        },
        include: {
          auctions_inventory: {
            include: {
              auction_bidder: { include: { auctions: true } },
            },
          },
        },
      });
    } catch (error) {
      handleError("Error getting price comparison", error);
    }
  },
};
