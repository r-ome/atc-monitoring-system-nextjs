import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IPaymentRepository } from "src/application/repositories/payments.repository.interface";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";

export const PaymentRepository: IPaymentRepository = {
  getPaymentsByDate: async (date) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const payments = await prisma.payments.findMany({
        where: { created_at: { gte: startOfDay, lte: endOfDay } },
        include: {
          payment_method: true,
          receipt: {
            include: {
              auction_bidder: { include: { bidder: true, auctions: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      return payments;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting payments", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getAuctionTransactions: async (auction_id) => {
    try {
      return await prisma.receipt_records.findMany({
        where: { auction_bidder: { auction_id } },
        orderBy: { created_at: "desc" },
        include: {
          auctions_inventories: true,
          payments: { include: { payment_method: true } },
          auction_bidder: { include: { bidder: true } },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching transactions", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  handleBidderPullOut: async (data) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const registered_bidder = await tx.auctions_bidders.findFirst({
          where: { auction_bidder_id: data.auction_bidder_id },
          include: { bidder: true },
        });

        if (!registered_bidder) {
          throw new NotFoundError("Error handling bidder pullout", {
            cause: "Registered Bidder not found!",
          });
        }

        const receipt = await tx.receipt_records.findFirst({
          where: {
            auction_bidder_id: data.auction_bidder_id,
            purpose: "PULL_OUT",
          },
        });

        let pull_out_number = 0;
        if (receipt) {
          pull_out_number = parseInt(receipt.receipt_number.split("-")[1], 10);
        }

        const receipt_number = `${registered_bidder.bidder.bidder_number}-${
          pull_out_number + 1
        }`;

        const auction_inventories = await tx.auctions_inventories.findMany({
          where: { auction_inventory_id: { in: data.auction_inventory_ids } },
        });

        const created_receipt = await tx.receipt_records.create({
          data: {
            receipt_number,
            purpose: "PULL_OUT",
            auction_bidder_id: data.auction_bidder_id,
            inventory_histories: {
              create: auction_inventories.map((auction_inventory) => ({
                auction_inventory_id: auction_inventory.auction_inventory_id,
                inventory_id: auction_inventory.inventory_id,
                auction_status: "PAID",
                inventory_status: "SOLD",
                remarks: "PAID FOR PULLOUT",
              })),
            },
          },
        });

        await Promise.all(
          data.payments.map((item) =>
            tx.payments.create({
              data: {
                receipt_id: created_receipt.receipt_id,
                amount_paid: item.amount_paid,
                payment_method_id: item.payment_method,
              },
            })
          )
        );

        await tx.auctions_inventories.updateMany({
          data: {
            receipt_id: created_receipt.receipt_id,
            status: "PAID",
          },
          where: {
            auction_inventory_id: {
              in: data.auction_inventory_ids,
            },
          },
        });

        await tx.auctions_bidders.update({
          where: { auction_bidder_id: data.auction_bidder_id },
          data: {
            balance: {
              decrement: data.amount_to_be_paid,
            },
            already_consumed: 1,
          },
        });

        return created_receipt;
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error handling bidder pullout!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  refundAuctionInventories: async (data) => {
    try {
      await prisma.$transaction(async (tx) => {
        const auction_bidder = await tx.auctions_bidders.findFirst({
          where: { auction_bidder_id: data.auction_bidder_id },
          include: { bidder: true },
        });

        if (!auction_bidder) {
          throw new NotFoundError("Auction Bidder not found!");
        }

        const atc_default_bidder = await tx.auctions_bidders.findFirst({
          where: {
            auction_id: auction_bidder?.auction_id,
            bidder: { bidder_number: "5013" },
          },
        });

        const cash_payment_method = await tx.payment_methods.findFirst({
          where: { name: "CASH" },
        });

        const refunded_receipts = await tx.receipt_records.findMany({
          select: { receipt_number: true },
          where: {
            purpose: "REFUNDED",
            auction_bidder_id: data.auction_bidder_id,
          },
        });
        const current_refunded_receipt_count = refunded_receipts.length;

        const receipt = await tx.receipt_records.create({
          data: {
            receipt_number: `${auction_bidder.bidder.bidder_number}REF${
              current_refunded_receipt_count + 1
            }`,
            auction_bidder_id: data.auction_bidder_id,
            purpose: "REFUNDED",
            remarks: data.reason,
            payments: {
              create: {
                amount_paid: data.auction_inventories.reduce(
                  (acc, item) =>
                    (acc +=
                      item.new_price +
                      (item.new_price * auction_bidder.service_charge) / 100),
                  0
                ),
                payment_method_id: cash_payment_method?.payment_method_id,
              },
            },
          },
        });

        await Promise.all(
          data.auction_inventories.map(async (item) => {
            const is_full_refund = item.prev_price === item.new_price;
            const auction_status = is_full_refund ? "REFUNDED" : "PAID";
            const inventory_status = is_full_refund ? "UNSOLD" : "SOLD";
            const remarks = `${is_full_refund ? "FULL" : "PARTIAL"} REFUND: ${
              data.reason
            }. ${
              is_full_refund
                ? ""
                : `From ${item.prev_price} to ${item.new_price}`
            }`;

            const auction_inventories = await tx.auctions_inventories.update({
              where: { auction_inventory_id: item.auction_inventory_id },
              data: {
                status: auction_status,
                price: item.new_price,
                auction_bidder: {
                  connect: {
                    auction_bidder_id: atc_default_bidder?.auction_bidder_id,
                  },
                },
                receipt: {
                  connect: {
                    receipt_id: receipt.receipt_id,
                  },
                },
                inventory: { update: { status: inventory_status } },
                histories: {
                  create: {
                    receipt_id: receipt.receipt_id,
                    inventory_id: item.inventory_id,
                    auction_status: auction_status,
                    inventory_status: inventory_status,
                    remarks,
                  },
                },
              },
            });

            return { auction_inventories };
          })
        );
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error refunding items!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getReceiptDetails: async (auction_id, receipt_number) => {
    try {
      const receipt = await prisma.receipt_records.findFirst({
        where: {
          receipt_number,
          auction_bidder: { auctions: { auction_id: auction_id } },
        },
        include: {
          auction_bidder: { include: { bidder: true } },
          inventory_histories: {
            include: { auction_inventory: { include: { inventory: true } } },
          },
          payments: { include: { payment_method: true } },
        },
      });

      if (!receipt) {
        throw new NotFoundError("Error getting Receipt Details!");
      }

      return receipt;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching Receipt Details!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getBidderReceipts: async (auction_bidder_id) => {
    try {
      return await prisma.receipt_records.findMany({
        where: { auction_bidder_id },
        include: {
          payments: { include: { payment_method: true } },
          auction_bidder: { include: { bidder: true } },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting bidder receipts", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  updateRegistrationPayment: async (payment_id, data) => {
    try {
      const current_payment = await prisma.payments.findFirst({
        where: { payment_id },
        include: { payment_method: true },
      });

      if (current_payment) {
        await prisma.payments.update({
          where: { payment_id },
          data: {
            payment_method_id: data.payment_method,
            remarks: `Updated payment type from ${current_payment?.payment_method?.name} to ${data.payment_method}`,
          },
        });
      }
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error handling bidder pullout!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
