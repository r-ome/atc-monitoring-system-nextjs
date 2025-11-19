import { IAuctionRepository } from "src/application/repositories/auctions.repository.interface";

import prisma from "@/app/lib/prisma/prisma";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import {
  ManifestInsertSchema,
  ManifestUpdateSchema,
} from "src/entities/models/Manifest";
import { Override } from "src/entities/models/Response";
import { AUCTION_ITEM_STATUS } from "src/entities/models/Auction";
import { isRange } from "@/app/lib/utils";

export const AuctionRepository: IAuctionRepository = {
  startAuction: async (auction_date) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const atc_default_bidder = await tx.bidders.findFirst({
          where: { bidder_number: "5013" },
        });

        if (!atc_default_bidder) {
          throw new NotFoundError("ATC DEFAULT BIDDER NOT FOUND!");
        }

        const created = await tx.auctions.create({
          data: {
            created_at: auction_date,
            registered_bidders: {
              create: {
                bidder_id: atc_default_bidder.bidder_id,
                service_charge: 0,
                registration_fee: 0,
                balance: 0,
              },
            },
          },
          include: {
            registered_bidders: {
              include: {
                bidder: true,
                receipt_records: { include: { payments: true } },
                auctions_inventories: {
                  include: { inventory: { include: { container: true } } },
                },
              },
            },
          },
        });

        return created;
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating Auction!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getAuctionById: async (auction_id) => {
    try {
      return await prisma.auctions.findFirst({
        where: { auction_id },
        include: {
          registered_bidders: {
            include: {
              bidder: true,
              receipt_records: { include: { payments: true } },
              auctions_inventories: {
                include: { inventory: { include: { container: true } } },
              },
            },
            orderBy: { created_at: "desc" },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching Auction", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getAuction: async (auction_date) => {
    try {
      let start: Date;
      let end: Date;
      if (auction_date instanceof Date) {
        start = new Date(auction_date);
        start.setHours(0, 0, 0, 0);

        end = new Date(auction_date);
        end.setHours(23, 59, 59, 999);
      } else if (isRange(auction_date)) {
        start = new Date(auction_date.start);
        end = new Date(auction_date.end);
      } else {
        throw new DatabaseOperationError("Invalid auction_date input");
      }

      return await prisma.auctions.findFirst({
        where: { created_at: { gte: start, lte: end } },
        include: {
          registered_bidders: {
            include: {
              bidder: true,
              receipt_records: { include: { payments: true } },
              auctions_inventories: {
                include: { inventory: { include: { container: true } } },
              },
            },
            orderBy: { created_at: "desc" },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching Auction", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  registerBidder: async (data) => {
    try {
      const bidder = await prisma.bidders.findFirst({
        where: { bidder_id: data.bidder_id },
      });

      return await prisma.auctions_bidders.create({
        data: {
          auction_id: data.auction_id,
          bidder_id: data.bidder_id,
          service_charge: data.service_charge,
          registration_fee: data.registration_fee,
          balance: data.balance,
          receipt_records: {
            create: {
              receipt_number: `${bidder?.bidder_number}REG`,
              purpose: "REGISTRATION",
              payments: {
                create: {
                  amount_paid: data.registration_fee,
                  payment_type: data.payment_method,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        console.error(error);
        throw new DatabaseOperationError("Error registering bidder", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getMonitoring: async (
    auction_id: string,
    status: AUCTION_ITEM_STATUS[] = []
  ) => {
    try {
      return await prisma.auctions_inventories.findMany({
        where: {
          auction_bidder: { auction_id: auction_id },
          status: status.length ? { in: status } : {},
        },
        include: {
          auction_bidder: { include: { bidder: true } },
          inventory: true,
          receipt: true,
          histories: { include: { receipt: true } },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching monitoring", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  uploadManifest: async (auction_id, data, is_bought_items = false) => {
    try {
      const valid_rows_in_sheet = data.filter(
        (item) => item.isValid && !item.forReassign
      );

      const for_reassigning = data.filter((item) => item.forReassign);

      const items_for_reassigning = for_reassigning.reduce(
        (acc: Record<string, string[]>, item) => {
          if (!item.auction_bidder_id || !item.auction_inventory_id) return acc;
          acc[item.auction_bidder_id] = [
            ...(acc[item.auction_bidder_id] ?? []),
            item.auction_inventory_id,
          ];
          return acc;
        },
        {}
      );

      return await prisma.$transaction(
        async (tx) => {
          const auction = await tx.auctions.findFirst({
            where: { auction_id },
          });

          if (!auction) {
            throw new DatabaseOperationError("Error Uploading Manifest", {
              cause: "NO AUCTION FOUND!",
            });
          }

          // insert manifest records
          await tx.manifest_records.createMany({
            data: data.map((item) => ({
              auction_id,
              barcode: item.BARCODE,
              control: item.CONTROL,
              description: item.DESCRIPTION,
              price: item.PRICE.toString(),
              bidder_number: item.BIDDER,
              qty: item.QTY,
              manifest_number: item.MANIFEST?.toString(),
              error_message: item.error,
            })),
          });

          // insert newly created_inventories
          const for_creating_inventories = valid_rows_in_sheet.filter(
            (item) => !item.inventory_id && item.container_id
          );

          await tx.inventories.createMany({
            data: for_creating_inventories.map((item) => ({
              container_id: item.container_id!,
              control: item.CONTROL,
              barcode: item.BARCODE,
              description: item.DESCRIPTION,
              status: is_bought_items ? "BOUGHT_ITEM" : "SOLD",
              auction_date: auction?.created_at,
            })),
          });

          const newly_created_inventories = await tx.inventories.findMany({
            where: {
              barcode: {
                in: for_creating_inventories.map((item) => item.BARCODE),
              },
            },
          });

          const auction_inventories = [
            ...valid_rows_in_sheet,
            ...(for_reassigning.length
              ? for_reassigning
              : ([] as typeof for_reassigning)),
          ].map((item) => {
            const match = newly_created_inventories.find((inventory) => {
              if (inventory.barcode.split("-").length === 3) {
                return inventory.barcode === item.BARCODE;
              }

              return (
                inventory.barcode === item.BARCODE &&
                inventory.control === item.CONTROL
              );
            });

            if (!item.auction_bidder_id) {
              throw new Error("Auction Bidder ID does not exist");
            }

            item.inventory_id = item.inventory_id ?? match?.inventory_id;
            return item as Override<
              ManifestInsertSchema,
              {
                auction_bidder_id: string;
                inventory_id: string;
                service_charge: number;
              }
            >;
          });

          const created_auctions_inventories = await Promise.all(
            auction_inventories
              .filter((item) => !item.forReassign)
              .map((item) =>
                tx.auctions_inventories.create({
                  data: {
                    auction_bidder_id: item.auction_bidder_id,
                    inventory_id: item.inventory_id,
                    description: item.DESCRIPTION,
                    status: is_bought_items ? "PAID" : "UNPAID",
                    price: parseInt(item.PRICE, 10),
                    qty: item.QTY,
                    manifest_number: item.MANIFEST as string,
                    auction_date: auction?.created_at,
                  },
                })
              )
          );

          const auctions_inventories = await tx.auctions_inventories.findMany({
            include: { histories: true },
            where: {
              auction_inventory_id: {
                in: [...created_auctions_inventories, ...for_reassigning].map(
                  (item) => item.auction_inventory_id as string
                ),
              },
            },
          });

          await tx.inventory_histories.createMany({
            data: auctions_inventories.map((item) => ({
              auction_inventory_id: item.auction_inventory_id,
              inventory_id: item.inventory_id,
              auction_status: "UNPAID",
              inventory_status: "SOLD",
              remarks: item.histories.length ? "REASSIGNED" : "ENCODED",
            })),
          });

          // reassign item if item status is cancelled
          if (Object.keys(items_for_reassigning).length) {
            await tx.inventories.updateMany({
              data: { status: "SOLD" },
              where: {
                inventory_id: {
                  in: for_reassigning.map(
                    (item) => item.inventory_id as string
                  ),
                },
              },
            });

            await Promise.all(
              Object.entries(items_for_reassigning).map(
                ([new_auction_bidder_id, auction_inventory_ids]) =>
                  tx.auctions_inventories.updateMany({
                    data: {
                      auction_bidder_id: new_auction_bidder_id,
                      status: "UNPAID",
                    },
                    where: {
                      auction_inventory_id: { in: auction_inventory_ids },
                    },
                  })
              )
            );
          }

          // update bidder balance
          const update_balance = auction_inventories.reduce(
            (acc: Record<string, number>, item) => {
              const price = parseInt(item.PRICE, 10);
              const service_charge_amount = (price * item.service_charge) / 100;
              const total = price + service_charge_amount;

              acc[item.auction_bidder_id] =
                (acc[item.auction_bidder_id] || 0) + total;

              return acc;
            },
            {}
          );

          await Promise.all(
            Object.entries(update_balance).map(([auction_bidder_id, amount]) =>
              tx.auctions_bidders.update({
                where: { auction_bidder_id },
                data: { balance: { increment: amount } },
              })
            )
          );

          return auctions_inventories;
        },
        { maxWait: 10000, timeout: 30000 }
      );
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error uploading manifest", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getManifestRecords: async (auction_id) => {
    try {
      return await prisma.manifest_records.findMany({
        where: { auction_id },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching Manifest Records", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getRegisteredBidders: async (auction_id) => {
    try {
      return await prisma.auctions_bidders.findMany({
        where: { auction_id },
        include: {
          bidder: true,
          auctions_inventories: {
            include: {
              receipt: true,
              inventory: { include: { container: true } },
              histories: {
                include: { receipt: true },
                orderBy: { created_at: "desc" },
              },
            },
          },
        },
        orderBy: { created_at: "asc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching registered bidders", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getRegisteredBidder: async (bidder_number, auction_id) => {
    try {
      return await prisma.auctions_bidders.findFirst({
        where: { bidder: { bidder_number }, auction_id },
        include: {
          bidder: true,
          auctions_inventories: {
            include: {
              receipt: true,
              inventory: { include: { container: true } },
              histories: {
                include: { receipt: true },
                orderBy: { created_at: "desc" },
              },
            },
            orderBy: { price: "desc" },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching registered bidder", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  cancelItems: async (data) => {
    try {
      await prisma.$transaction(async (tx) => {
        const bidder = await tx.auctions_bidders.findFirst({
          where: { auction_bidder_id: data.auction_bidder_id },
          include: { bidder: true },
        });

        if (!bidder) {
          throw new NotFoundError("Bidder not found!");
        }

        const auction_inventories = await tx.auctions_inventories.findMany({
          where: { auction_inventory_id: { in: data.auction_inventory_ids } },
          include: { receipt: true },
        });

        const paid_items = auction_inventories.filter(
          (item) => item.status === "PAID"
        );
        const unpaid_items = auction_inventories.filter(
          (item) => item.status === "UNPAID"
        );

        const computeTotalPrice = (
          acc: number,
          item: (typeof auction_inventories)[number]
        ) => {
          const service_charge_amount =
            (item.price * bidder.service_charge) / 100;
          const total = item.price + service_charge_amount;
          acc += total;
          return acc;
        };

        // update bidder balance
        if (unpaid_items.length) {
          const unpaid_items_total_price = unpaid_items.reduce(
            computeTotalPrice,
            0
          );
          await tx.auctions_bidders.update({
            data: { balance: { decrement: unpaid_items_total_price } },
            where: { auction_bidder_id: data.auction_bidder_id },
          });
        }

        if (paid_items.length) {
          const paid_items_total_price = paid_items.reduce(
            computeTotalPrice,
            0
          );

          await tx.receipt_records.create({
            data: {
              receipt_number: `${bidder.bidder.bidder_number}-refund`,
              auction_bidder_id: data.auction_bidder_id,
              purpose: "REFUNDED",
              remarks: data.reason,
              payments: {
                create: {
                  amount_paid: paid_items_total_price,
                  payment_type: "CASH",
                },
              },
              inventory_histories: {
                createMany: {
                  data: paid_items.map((paid_item) => ({
                    auction_inventory_id: paid_item.auction_inventory_id,
                    inventory_id: paid_item.inventory_id,
                    auction_status: "CANCELLED",
                    inventory_status: "UNSOLD",
                    remarks: `REFUNDED: ${data.reason}`,
                  })),
                },
              },
            },
          });
        }

        const atc_default_bidder = await tx.auctions_bidders.findFirst({
          where: {
            auction_id: bidder.auction_id,
            bidder: { bidder_number: "5013" },
          },
        });

        await tx.auctions_inventories.updateMany({
          data: {
            status: "CANCELLED",
            auction_bidder_id: atc_default_bidder?.auction_bidder_id,
          },
          where: { auction_inventory_id: { in: data.auction_inventory_ids } },
        });

        await tx.inventories.updateMany({
          data: { status: "UNSOLD" },
          where: { inventory_id: { in: data.inventory_ids } },
        });

        // add history
        if (unpaid_items.length) {
          await Promise.all(
            unpaid_items.map((auction_inventory) =>
              tx.inventory_histories.create({
                data: {
                  auction_inventory_id: auction_inventory.auction_inventory_id,
                  inventory_id: auction_inventory.inventory_id,
                  auction_status: "CANCELLED",
                  inventory_status: "UNSOLD",
                  remarks: data.reason,
                },
              })
            )
          );
        }
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error cancelling items!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getBiddersWithBalance: async () => {
    try {
      return await prisma.auctions_bidders.findMany({
        where: { balance: { gt: 0 } },
        include: {
          bidder: true,
          auctions_inventories: { include: { inventory: true } },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting bidders with balance", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  uploadCounterCheck: async (auction_id, data) => {
    try {
      const valid_rows_in_sheet = data.filter((item) => item.isValid);

      const counter_check_records = await prisma.counter_check.createMany({
        data: valid_rows_in_sheet.map((item) => ({
          auction_id,
          control: item.CONTROL,
          price: item.PRICE.toString(),
          page: item.PAGE,
          bidder_number: item.BIDDER,
          error: item.error,
        })),
      });

      return counter_check_records;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(error.message, {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getCounterCheckRecords: async (auction_id) => {
    try {
      return await prisma.counter_check.findMany({
        where: { auction_id },
        orderBy: { page: "asc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(error.message, {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updateCounterCheck: async (counter_check_id, data) => {
    try {
      return await prisma.counter_check.update({
        where: { counter_check_id },
        data: {
          page: data.page,
          control: data.control,
          bidder_number: data.bidder_number,
          price: data.price,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(error.message, {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updateManifest: async (manifest_id, data, original) => {
    try {
      const valid_rows_in_sheet = data.filter((item) => item.isValid);

      return await prisma.$transaction(
        async (tx) => {
          // update manifest record
          const manifest = await tx.manifest_records.update({
            where: { manifest_id },
            data: {
              barcode: original.barcode,
              control: original.control,
              description: original.description,
              price: original.price.toString(),
              bidder_number: original.bidder_number,
              qty: original.qty,
              manifest_number: original.manifest_number?.toString(),
              error_message: data[0].error,
            },
          });

          const auction = await tx.auctions.findFirst({
            where: { auction_id: manifest.auction_id },
          });

          if (!auction) {
            throw new DatabaseOperationError("Error updating manifest", {
              cause: "No auction found!",
            });
          }

          // insert newly created_inventories
          const for_creating_inventories = valid_rows_in_sheet.filter(
            (item) => !item.inventory_id && item.container_id
          );

          await tx.inventories.createMany({
            data: for_creating_inventories.map((item) => ({
              container_id: item.container_id!,
              control: item.control,
              barcode: item.barcode,
              description: item.description,
              status: "SOLD",
            })),
          });

          const newly_created_inventories = await tx.inventories.findMany({
            where: {
              barcode: {
                in: for_creating_inventories.map((item) => item.barcode),
              },
            },
          });

          const auction_inventories = valid_rows_in_sheet.map((item) => {
            const match = newly_created_inventories.find(
              (inventory) => inventory.barcode === item.barcode
            );
            if (!item.auction_bidder_id) {
              throw new Error("Auction Bidder ID does not exist");
            }
            item.inventory_id = item.inventory_id ?? match?.inventory_id;
            return item as Override<
              ManifestUpdateSchema,
              {
                auction_bidder_id: string;
                inventory_id: string;
                service_charge: number;
              }
            >;
          });

          const created_auctions_inventories = await Promise.all(
            auction_inventories.map((item) =>
              tx.auctions_inventories.create({
                data: {
                  auction_bidder_id: item.auction_bidder_id,
                  inventory_id: item.inventory_id,
                  description: item.description,
                  status: "UNPAID",
                  price: parseInt(item.price, 10),
                  qty: item.qty,
                  manifest_number: item.manifest_number as string,
                  auction_date: auction.created_at,
                },
              })
            )
          );
          const auctions_inventories = await tx.auctions_inventories.findMany({
            include: { histories: true },
            where: {
              auction_inventory_id: {
                in: created_auctions_inventories.map(
                  (item) => item.auction_inventory_id as string
                ),
              },
            },
          });
          await tx.inventory_histories.createMany({
            data: auctions_inventories.map((item) => ({
              auction_inventory_id: item.auction_inventory_id,
              inventory_id: item.inventory_id,
              auction_status: "UNPAID",
              inventory_status: "SOLD",
              remarks: item.histories.length ? "REASSIGNED" : "ENCODED",
            })),
          });
          // update bidder balance
          const update_balance = auction_inventories.reduce(
            (acc: Record<string, number>, item) => {
              const price = parseInt(item.price, 10);
              const service_charge_amount = (price * item.service_charge) / 100;
              const total = price + service_charge_amount;
              acc[item.auction_bidder_id] =
                (acc[item.auction_bidder_id] || 0) + total;
              return acc;
            },
            {}
          );
          await Promise.all(
            Object.entries(update_balance).map(([auction_bidder_id, amount]) =>
              tx.auctions_bidders.update({
                where: { auction_bidder_id },
                data: { balance: { increment: amount } },
              })
            )
          );

          return manifest;
        },
        { maxWait: 10000, timeout: 30000 }
      );
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(error.message, {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
