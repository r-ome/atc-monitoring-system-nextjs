import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IPaymentRepository } from "src/application/repositories/payments.repository.interface";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { StorageFeePaymentInput } from "src/entities/models/Payment";
import { getItemPriceWithServiceChargeAmount } from "@/app/lib/utils";
import {
  buildPartialRefundHistoryRemark,
  buildPulloutPaidHistoryRemark,
  buildPulloutUndoneHistoryRemark,
  buildRefundedHistoryRemark,
} from "src/entities/models/InventoryHistoryRemark";

export const PaymentRepository: IPaymentRepository = {
  getPaymentById: async (payment_id) => {
    try {
      return await prisma.payments.findFirst({
        where: { payment_id },
        include: { payment_method: true },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting payment", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getPaymentsByDate: async (date, branch_id) => {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const payments = await prisma.payments.findMany({
        where: {
          created_at: { gte: startOfDay, lte: endOfDay },
          ...(branch_id
            ? {
                receipt: {
                  auction_bidder: {
                    auctions: { branch_id },
                  },
                },
              }
            : {}),
        },
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

        const auction_inventories = await tx.auctions_inventories.findMany({
          where: { auction_inventory_id: { in: data.auction_inventory_ids } },
        });

        const selected_statuses = new Set(
          auction_inventories.map((auction_inventory) => auction_inventory.status),
        );

        if (
          selected_statuses.has("UNPAID") &&
          selected_statuses.has("PAID")
        ) {
          throw new InputParseError("Invalid pull-out selection!", {
            cause: {
              auction_inventory_ids: [
                "Pull-out cannot mix UNPAID and PAID items. Please select only one payment status at a time.",
              ],
            },
          });
        }

        let status = "UNPAID";
        if (auction_inventories[0]) {
          status = auction_inventories[0].status;
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
                remarks: buildPulloutPaidHistoryRemark(),
              })),
            },
          },
        });

        const storage_fee = data.storage_fee ?? 0;

        await Promise.all(
          data.payments.map((item) => {
            const storage_portion =
              storage_fee > 0
                ? Math.round(
                    (item.amount_paid * storage_fee) / data.amount_to_be_paid,
                  )
                : 0;
            const pullout_portion = item.amount_paid - storage_portion;
            return tx.payments.create({
              data: {
                receipt_id: created_receipt.receipt_id,
                amount_paid: pullout_portion,
                payment_method_id: item.payment_method,
              },
            });
          }),
        );

        if (storage_fee > 0) {
          const sf_count = await tx.receipt_records.count({
            where: { receipt_number: { startsWith: `${receipt_number}SF` } },
          });
          const sf_receipt_number = `${receipt_number}SF${sf_count + 1}`;
          const sf_receipt = await tx.receipt_records.create({
            data: {
              receipt_number: sf_receipt_number,
              purpose: "STORAGE_FEE",
              auction_bidder_id: data.auction_bidder_id,
            },
          });
          await Promise.all(
            data.payments.map((item) => {
              const storage_portion = Math.round(
                (item.amount_paid * storage_fee) / data.amount_to_be_paid,
              );
              return tx.payments.create({
                data: {
                  receipt_id: sf_receipt.receipt_id,
                  amount_paid: storage_portion,
                  payment_method_id: item.payment_method,
                },
              });
            }),
          );
        }

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
  refundAuctionInventories: async (data, updated_by) => {
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
            bidder: { bidder_number: ATC_DEFAULT_BIDDER_NUMBER },
          },
        });

        const cash_payment_method = await tx.payment_methods.findFirst({
          where: { name: "CASH" },
        });

        const is_all_full_refund = data.auction_inventories.every(
          (item) => item.prev_price === item.new_price,
        );
        const receipt_purpose = is_all_full_refund ? "REFUNDED" : "LESS";
        const receipt_prefix = is_all_full_refund ? "REF" : "LESS";

        const refunded_receipts = await tx.receipt_records.findMany({
          select: { receipt_number: true },
          where: {
            purpose: receipt_purpose,
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
          0,
        );

        const receipt = await tx.receipt_records.create({
          data: {
            receipt_number: `${auction_bidder.bidder.bidder_number}${receipt_prefix}${
              current_refunded_receipt_count + 1
            }`,
            auction_bidder_id: data.auction_bidder_id,
            purpose: receipt_purpose,
            remarks: data.reason,
            payments: {
              create: {
                amount_paid: getItemPriceWithServiceChargeAmount(
                  total_amount_paid,
                  auction_bidder.service_charge,
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
            const remarks = is_full_refund
              ? buildRefundedHistoryRemark(
                  {
                    bidder_number: auction_bidder.bidder.bidder_number,
                    bidder_name: `${auction_bidder.bidder.first_name} ${auction_bidder.bidder.last_name}`,
                  },
                  data.reason,
                  updated_by,
                )
              : buildPartialRefundHistoryRemark(
                  {
                    bidder_number: auction_bidder.bidder.bidder_number,
                    bidder_name: `${auction_bidder.bidder.first_name} ${auction_bidder.bidder.last_name}`,
                  },
                  data.reason,
                  {
                    previous_price: item.prev_price,
                    new_price: item.new_price,
                  },
                  updated_by,
                );

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
          }),
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
            include: {
              auction_inventory: {
                include: {
                  inventory: true,
                  histories: { orderBy: { created_at: "desc" } },
                },
              },
            },
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
        const new_payment_method = await prisma.payment_methods.findFirst({
          where: { payment_method_id: data.payment_method },
        });

        await prisma.payments.update({
          where: { payment_id },
          data: {
            payment_method_id: data.payment_method,
            remarks: `Updated payment type from ${current_payment?.payment_method?.name} to ${new_payment_method?.name}`,
          },
        });
      }
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error handling bidder registration update!",
          {
            cause: error.message,
          },
        );
      }

      throw error;
    }
  },
  addStorageFee: async (data: StorageFeePaymentInput) => {
    try {
      await prisma.$transaction(async (tx) => {
        const parent = await tx.receipt_records.findFirst({
          where: { receipt_id: data.parent_receipt_id },
          include: { auction_bidder: { include: { bidder: true } } },
        });

        if (!parent) {
          throw new NotFoundError("Parent receipt not found!");
        }

        const sf_count = await tx.receipt_records.count({
          where: {
            receipt_number: { startsWith: `${parent.receipt_number}SF` },
          },
        });

        const receipt_number = `${parent.receipt_number}SF${sf_count + 1}`;

        await tx.receipt_records.create({
          data: {
            receipt_number,
            purpose: "STORAGE_FEE",
            auction_bidder_id: parent.auction_bidder_id,
            payments: {
              create: {
                amount_paid: data.amount,
                payment_method_id: data.payment_method_id,
              },
            },
          },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error adding storage fee!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  undoPayment: async (receipt_id) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const receipt = await tx.receipt_records.findFirst({
          where: { receipt_id },
          include: {
            payments: true,
            auctions_inventories: true,
            auction_bidder: true,
          },
        });

        if (!receipt) {
          throw new NotFoundError("Error undoing payment!", {
            cause: "Receipt not found!",
          });
        }

        if (receipt.purpose !== "PULL_OUT") {
          throw new InputParseError("Invalid undo payment request!", {
            cause: {
              receipt_id: ["Only PULL_OUT receipts can be undone."],
            },
          });
        }

        const has_storage_fee_receipts = await tx.receipt_records.count({
          where: {
            auction_bidder_id: receipt.auction_bidder_id,
            purpose: "STORAGE_FEE",
            receipt_number: { startsWith: `${receipt.receipt_number}SF` },
          },
        });

        if (has_storage_fee_receipts > 0) {
          throw new InputParseError("Cannot undo payment with storage fees!", {
            cause: {
              receipt_id: [
                "Undo the linked storage fee receipt(s) first before undoing this pull-out payment.",
              ],
            },
          });
        }

        const has_non_paid_items = receipt.auctions_inventories.some(
          (auction_inventory) => auction_inventory.status !== "PAID",
        );

        if (has_non_paid_items) {
          throw new InputParseError("Cannot undo payment with updated items!", {
            cause: {
              receipt_id: [
                "This receipt already has cancelled, refunded, or otherwise updated items. Undo is blocked to prevent data corruption.",
              ],
            },
          });
        }

        const total_payment = receipt?.payments.reduce(
          (acc, item) => (acc += item.amount_paid),
          0,
        );

        const remaining_bidder_receipts = await tx.receipt_records.findMany({
          where: {
            auction_bidder_id: receipt.auction_bidder_id,
            purpose: { in: ["PULL_OUT", "ADD_ON"] },
            receipt_id: { not: receipt.receipt_id },
          },
          select: { receipt_id: true },
        });

        await tx.auctions_bidders.update({
          where: {
            auction_bidder_id: receipt.auction_bidder_id,
          },
          data: {
            balance: { increment: total_payment },
            already_consumed: remaining_bidder_receipts.length > 0 ? 1 : 0,
          },
        });

        await tx.auctions_inventories.updateMany({
          where: { receipt_id },
          data: { status: "UNPAID", receipt_id: null },
        });

        await tx.inventories.updateMany({
          where: {
            inventory_id: {
              in: receipt.auctions_inventories.map((item) => item.inventory_id),
            },
          },
          data: { status: "SOLD" },
        });

        await tx.payments.deleteMany({ where: { receipt_id } });
        await tx.receipt_records.delete({ where: { receipt_id } });

        await tx.inventory_histories.createMany({
          data: receipt.auctions_inventories.map((item) => ({
            auction_inventory_id: item.auction_inventory_id,
            inventory_id: item.inventory_id,
            auction_status: "UNPAID",
            inventory_status: "SOLD",
            remarks: buildPulloutUndoneHistoryRemark(),
          })),
        });

        return {
          receipt_id: receipt.receipt_id,
          receipt_number: receipt.receipt_number,
          restored_item_count: receipt.auctions_inventories.length,
        };
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
