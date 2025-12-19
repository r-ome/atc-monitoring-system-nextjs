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
import { getItemPriceWithServiceChargeAmount } from "@/app/lib/utils";

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

        // get status if PARTIAL or UNPAID
        const auction_item = await tx.auctions_inventories.findFirst({
          select: { status: true },
          where: { auction_inventory_id: data.auction_inventory_ids[0] },
        });

        let status = "UNPAID";
        if (auction_item) {
          status = auction_item.status;
        }

        const receipt = await tx.receipt_records.findFirst({
          where: {
            auction_bidder_id: data.auction_bidder_id,
            purpose: status === "UNPAID" ? "PULL_OUT" : "ADD_ON",
          },
          orderBy: { created_at: "desc" },
        });

        let pull_out_number = 1;
        if (receipt) {
          pull_out_number =
            parseInt(receipt.receipt_number.split("-")[1], 10) + 1;
        }

        const receipt_number =
          status === "UNPAID"
            ? `${registered_bidder.bidder.bidder_number}-${pull_out_number}`
            : `${registered_bidder.bidder.bidder_number}(AO)-${pull_out_number}`;

        const auction_inventories = await tx.auctions_inventories.findMany({
          where: { auction_inventory_id: { in: data.auction_inventory_ids } },
        });

        const created_receipt = await tx.receipt_records.create({
          data: {
            receipt_number,
            purpose: status === "UNPAID" ? "PULL_OUT" : "ADD_ON",
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
      /**
       * amount_paid in payments should be positive
       * only deduct at final UI when receipt_records.purpose is "REFUNDED"
       *
       * FULL REFUND SCENARIO
       * Condition:
       * prev_price SHOULD BE EQUAL to new_price
       * Computation:
       * amount_paid = getServiceChargeAmount(prev_price, service_charge);
       * set auction_inventory.status = "REFUNDED"
       * set auction_inventory.auction_bidder_id = "5013"/ATC ACCOUNT
       * set inventory.status = "UNSOLD"
       *
       * (PARTIAL REFUND)/LESS SCENARIO
       * Condition:
       * prev_price SHOULD BE GREATER THAN to new_price
       * Computation:
       * Item(s) Total Price: P1,000
       * item_1: P1000 (prev_price)
       * new_price = P100
       * refund/difference amount: P900
       * amount_paid = getServiceChargeAmount(difference, service_charge)
       * set auction_inventory.status = "PAID"
       * set inventory.status = "SOLD"
       * add inventory_history
       */

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

        const total_amount_paid = data.auction_inventories.reduce(
          (acc, item) => {
            return (acc +=
              item.prev_price === item.new_price
                ? item.prev_price
                : item.prev_price - item.new_price);
          },
          0
        );

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
                amount_paid: getItemPriceWithServiceChargeAmount(
                  total_amount_paid,
                  auction_bidder.service_charge
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
                : `(LESS) From ${item.prev_price} to ${item.new_price}`
            }`;

            const auction_inventories = await tx.auctions_inventories.update({
              where: { auction_inventory_id: item.auction_inventory_id },
              data: {
                status: auction_status,
                price: item.new_price,
                auction_bidder: {
                  connect: {
                    auction_bidder_id: is_full_refund
                      ? atc_default_bidder?.auction_bidder_id
                      : data.auction_bidder_id,
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
        throw new DatabaseOperationError(
          "Error handling bidder registration update!",
          {
            cause: error.message,
          }
        );
      }

      throw error;
    }
  },
  undoPayment: async (receipt_id) => {
    try {
      await prisma.$transaction(async (tx) => {
        const receipt = await tx.receipt_records.findFirst({
          where: { receipt_id },
          include: {
            payments: true,
            auctions_inventories: true,
            auction_bidder: true,
          },
        });

        const total_payment = receipt?.payments.reduce(
          (acc, item) => (acc += item.amount_paid),
          0
        );

        // to check if bidder already consumed his registration fee
        const bidder_receipt_records = await tx.receipt_records.findMany({
          where: {
            auction_bidder_id: receipt?.auction_bidder.auction_bidder_id,
            purpose: "PULL_OUT",
          },
          select: { receipt_number: true },
        });

        // check if already has dash two
        const has_dash_two = bidder_receipt_records.filter((item) =>
          item.receipt_number.includes("-2")
        ).length;

        await tx.auctions_bidders.update({
          where: {
            auction_bidder_id: receipt?.auction_bidder.auction_bidder_id,
          },
          data: {
            balance: { increment: total_payment },
            already_consumed: !!has_dash_two ? 1 : 0,
          },
        });

        await tx.auctions_inventories.updateMany({
          where: { receipt_id },
          data: { status: "UNPAID", receipt_id: null },
        });

        await tx.payments.deleteMany({ where: { receipt_id } });
        await tx.receipt_records.delete({ where: { receipt_id } });
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
};
