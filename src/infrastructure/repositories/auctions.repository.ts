import { Prisma } from "@prisma/client";
import { IAuctionRepository } from "src/application/repositories/auctions.repository.interface";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { logger } from "@/app/lib/logger";
import prisma from "@/app/lib/prisma/prisma";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  buildBoughtItemEncodedHistoryRemark,
  buildCancelledHistoryRemark,
  buildEncodedAgainHistoryRemark,
  buildEncodedHistoryRemark,
  buildManifestReencodedHistoryRemark,
  parseInventoryHistoryRemark,
  buildRefundedHistoryRemark,
} from "src/entities/models/InventoryHistoryRemark";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import {
  UploadManifestInput,
  UpdateManifestInput,
} from "src/entities/models/Manifest";
import {
  AuctionItemStatus,
  CANCELLED_OR_REFUNDED_AUCTION_ITEM_STATUSES,
  AuctionInventoryWithDetailsRow,
  Override,
} from "src/entities/models/Auction";
import { isRange } from "@/app/lib/utils";
import { buildReusedInventoryUpdates } from "./auction-manifest-write";

function resolvePartialBalancePriceFromLegacyHistoryRemark(
  remarks: string | null | undefined,
) {
  const parsed = parseInventoryHistoryRemark(remarks);
  if (
    typeof parsed.previous_price !== "number" ||
    typeof parsed.new_price !== "number"
  ) {
    return null;
  }

  return parsed.new_price - parsed.previous_price;
}

export const AuctionRepository: IAuctionRepository = {
  startAuction: async (auction_date) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const atc_default_bidder = await tx.bidders.findFirst({
          where: { bidder_number: ATC_DEFAULT_BIDDER_NUMBER },
        });

        if (!atc_default_bidder) {
          throw new NotFoundError("ATC DEFAULT BIDDER NOT FOUND!");
        }

        return await tx.auctions.create({
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
  getAuctionId: async (auction_date) => {
    try {
      const start = new Date(auction_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(auction_date);
      end.setHours(23, 59, 59, 999);

      return await prisma.auctions.findFirst({
        where: { created_at: { gte: start, lte: end } },
        select: { auction_id: true },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching auction ID", {
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
                include: {
                  inventory: {
                    include: {
                      container: {
                        select: { container_id: true, barcode: true },
                      },
                    },
                  },
                },
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

      return await prisma.$transaction(async (tx) => {
        return await tx.auctions_bidders.create({
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
                  createMany: {
                    data: data.payments.map((payment) => ({
                      amount_paid: payment.amount_paid,
                      payment_method_id: payment.payment_method,
                    })),
                  },
                },
              },
            },
          },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error registering bidder", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getMonitoring: async (
    auction_id: string,
    status: AuctionItemStatus[] = [],
  ) => {
    try {
      if (auction_id === "ALL") {
        const result = (await prisma.auctions_inventories.findMany({
          where: status.length ? { status: { in: status } } : {},
          select: {
            auction_inventory_id: true,
            auction_bidder_id: true,
            inventory_id: true,
            receipt_id: true,
            description: true,
            status: true,
            price: true,
            qty: true,
            manifest_number: true,
            is_slash_item: true,
            auction_date: true,
            created_at: true,
            updated_at: true,
            inventory: {
              select: {
                inventory_id: true,
                barcode: true,
                control: true,
                status: true,
              },
            },
            auction_bidder: {
              select: {
                service_charge: true,
                registration_fee: true,
                already_consumed: true,
                balance: true,
                bidder: {
                  select: {
                    bidder_id: true,
                    bidder_number: true,
                    first_name: true,
                    last_name: true,
                  },
                },
              },
            },
            receipt: {
              select: {
                receipt_id: true,
                receipt_number: true,
              },
            },
          },
        })) as unknown as AuctionInventoryWithDetailsRow[];
        return result;
      }

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
  uploadManifest: async (
    auction_id,
    data,
    is_bought_items = false,
    uploaded_by,
  ) => {
    try {
      /**
       * steps:
       * 1. insert manifest_records
       * 2. create new inventories
       * 3. create auction inventories and link them to newly created inventories
       * 4. update cancelled auction_inventories if (new ones where encoded)
       *
       * scenarios:
       * a. newly fresh auction_inventory with new inventories
       * b. link existing inventories to auction_inventories
       * c. update cancelled auctions_inventories
       * d. container barcodes without inventory barcode (e.g. 00-08)
       */

      return await prisma.$transaction(async (tx) => {
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
            is_slash_item: item.isSlashItem,
            error_message: item.error,
            remarks: uploaded_by ?? null,
          })),
        });

        const { new_inventories, for_updating } = data
          .filter((item) => item.isValid)
          .reduce(
            (acc, item) => {
              if (item.forUpdating) {
                acc.for_updating.push(item);
              } else {
                acc.new_inventories.push(item);
              }
              return acc;
            },
            {
              new_inventories: [] as UploadManifestInput[],
              for_updating: [] as UploadManifestInput[],
            },
          );

        // create new inventories (items that has no record in container inventories)
        await tx.inventories.createMany({
          data: new_inventories.map((item) => ({
            container_id: item.container_id!,
            barcode: item.BARCODE,
            control: item.CONTROL,
            description: item.DESCRIPTION,
            status: is_bought_items ? "BOUGHT_ITEM" : "SOLD",
            is_bought_item: is_bought_items
              ? parseInt(item.PRICE, 10)
              : undefined,
            auction_date: auction.created_at,
          })),
        });

        const newly_created_inventories = await tx.inventories.findMany({
          where: {
            auctions_inventory: null,
            barcode: {
              in: new_inventories.map((item) => item.BARCODE),
            },
          },
        });

        const existing_auction_inventories_for_update = for_updating.length
          ? await tx.auctions_inventories.findMany({
              include: { histories: true, inventory: true },
              where: {
                auction_inventory_id: {
                  in: for_updating
                    .map((item) => item.auction_inventory_id)
                    .filter(
                      (auction_inventory_id): auction_inventory_id is string =>
                        Boolean(auction_inventory_id),
                    ),
                },
              },
            })
          : [];

        // match for_updating items to their cancelled/refunded/bought_item auction_inventories
        const items_to_reencode = is_bought_items
          ? []
          : for_updating
              .map((item) => {
                const match = existing_auction_inventories_for_update.find((auction_inventory) => {
                  return (
                    auction_inventory.inventory_id === item.inventory_id &&
                    (CANCELLED_OR_REFUNDED_AUCTION_ITEM_STATUSES.includes(
                      auction_inventory.status,
                    ) ||
                      ["BOUGHT_ITEM"].includes(auction_inventory.inventory.status))
                  );
                });

                if (!match) return null;

                return {
                  ...item,
                  auction_inventory_id: match.auction_inventory_id,
                  previous_status:
                    match.inventory.status === "BOUGHT_ITEM"
                      ? match.inventory.status
                      : match.status,
                };
              })
              .filter((item) => item !== null);

        const reusedInventoryUpdates = buildReusedInventoryUpdates(
          for_updating,
          auction.created_at,
          is_bought_items,
        );

        if (reusedInventoryUpdates.length) {
          await Promise.all(
            reusedInventoryUpdates.map((inventory) =>
              tx.inventories.update({
                data: inventory.data,
                where: { inventory_id: inventory.inventory_id },
              }),
            ),
          );
        }

        // link valid items to their inventory_id (newly created or existing)
        const items_for_insert = [...new_inventories, ...for_updating].map(
          (item) => {
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

            return {
              ...item,
              inventory_id: item.inventory_id ?? match?.inventory_id,
            } as Override<
              UploadManifestInput,
              {
                auction_bidder_id: string;
                inventory_id: string;
                service_charge: number;
              }
            >;
          },
        );

        // insert data in auctions_inventories table
        const created_auctions_inventories = await Promise.all(
          items_for_insert
            .filter((item) => !item.auction_inventory_id)
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
                  is_slash_item: item.isSlashItem,
                },
              }),
            ),
        );

        /**
         * If item is CANCELLED or REFUNDED or BOUGHT ITEM(inventory_status) but was encoded again:
         * update item inventory status to: SOLD
         * update auction inventory status to: UNPAID
         */
        if (items_to_reencode.length) {
          await Promise.all(
            items_to_reencode.map((item) =>
              tx.auctions_inventories.update({
                data: {
                  auction_bidder_id: item.auction_bidder_id as string,
                  description: item.DESCRIPTION,
                  price: parseInt(item.PRICE, 10),
                  qty: item.QTY,
                  manifest_number: item.MANIFEST as string,
                  status: "UNPAID",
                  auction_date: auction.created_at,
                  is_slash_item: item.isSlashItem,
                },
                where: {
                  auction_inventory_id: item.auction_inventory_id,
                },
              }),
            ),
          );
        }

        const auctions_inventories = await tx.auctions_inventories.findMany({
          include: { histories: true, inventory: true },
          where: {
            auction_inventory_id: {
              in: [...created_auctions_inventories, ...for_updating]
                .filter((item) => item.auction_inventory_id)
                .map((item) => item.auction_inventory_id as string),
            },
          },
        });

        const reencoded_auction_inventory_ids = new Set(
          items_to_reencode.map((item) => item.auction_inventory_id),
        );

        const encoded_histories: Prisma.inventory_historiesCreateManyInput[] = auctions_inventories
          .filter(
            (item) =>
              !reencoded_auction_inventory_ids.has(item.auction_inventory_id),
          )
          .map((item) => ({
            auction_inventory_id: item.auction_inventory_id,
            inventory_id: item.inventory_id,
            auction_status: is_bought_items ? "PAID" : "UNPAID",
            inventory_status: is_bought_items ? "BOUGHT_ITEM" : "SOLD",
            remarks: is_bought_items
              ? buildBoughtItemEncodedHistoryRemark(uploaded_by)
              : buildEncodedHistoryRemark(uploaded_by),
          }));

        // add "encoded" in history
        if (encoded_histories.length) {
          await tx.inventory_histories.createMany({
            data: encoded_histories,
          });
        }

        if (items_to_reencode.length) {
          // ADD HISTORY FOR ENCODING AGAIN
          await tx.inventory_histories.createMany({
            data: items_to_reencode.map((item) => ({
              auction_inventory_id: item.auction_inventory_id,
              inventory_id: item.inventory_id!,
              auction_status: "UNPAID",
              inventory_status: "SOLD",
              remarks: buildEncodedAgainHistoryRemark(item.previous_status),
            })),
          });
        }

        if (!is_bought_items) {
          const update_balance = items_for_insert.reduce(
            (acc: Record<string, number>, item) => {
              const price = parseInt(item.PRICE, 10);
              const service_charge_amount = (price * item.service_charge) / 100;
              const total = price + service_charge_amount;

              acc[item.auction_bidder_id] =
                (acc[item.auction_bidder_id] || 0) + total;

              return acc;
            },
            {},
          );

          await Promise.all(
            Object.entries(update_balance).map(([auction_bidder_id, amount]) =>
              tx.auctions_bidders.update({
                where: { auction_bidder_id },
                data: { balance: { increment: amount } },
              }),
            ),
          );
        }

        return auctions_inventories;
      });
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
  getManifestRecord: async (manifest_id) => {
    try {
      return await prisma.manifest_records.findFirst({
        where: { manifest_id },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching Manifest Record", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getRegisteredBiddersSummary: async (auction_id) => {
    try {
      return await prisma.auctions_bidders.findMany({
        where: { auction_id },
        include: {
          bidder: true,
          _count: { select: { auctions_inventories: true } },
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
  getRegisteredBidders: async (auction_id) => {
    try {
      return await prisma.auctions_bidders.findMany({
        where: { auction_id },
        include: {
          bidder: true,
          auctions_inventories: {
            include: {
              receipt: true,
              inventory: {
                include: {
                  container: { select: { container_id: true, barcode: true } },
                },
              },
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
  getRegisteredBiddersForManifest: async (auction_id) => {
    try {
      return await prisma.auctions_bidders.findMany({
        where: { auction_id },
        select: {
          auction_bidder_id: true,
          service_charge: true,
          bidder: { select: { bidder_number: true, status: true } },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error fetching registered bidders for manifest",
          {
            cause: error.message,
          },
        );
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
  getRegisteredBidderById: async (auction_bidder_id) => {
    try {
      return await prisma.auctions_bidders.findFirst({
        where: { auction_bidder_id },
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
  cancelItems: async (data, updated_by) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const bidder = await tx.auctions_bidders.findFirst({
          where: { auction_bidder_id: data.auction_bidder_id },
          include: { bidder: true },
        });

        const cash_payment_method = await tx.payment_methods.findFirst({
          where: { name: "CASH" },
        });

        if (!bidder) {
          throw new NotFoundError("Bidder not found!");
        }

        const auction_inventories = await tx.auctions_inventories.findMany({
          where: { auction_inventory_id: { in: data.auction_inventory_ids } },
          include: { receipt: true },
        });

        const paid_items = auction_inventories.filter(
          (item) => item.status === "PAID",
        );
        const unpaid_items = auction_inventories.filter(
          (item) => item.status === "UNPAID",
        );

        const computeTotalPrice = (
          acc: number,
          item: (typeof auction_inventories)[number],
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
            0,
          );
          await tx.auctions_bidders.update({
            data: { balance: { decrement: unpaid_items_total_price } },
            where: { auction_bidder_id: data.auction_bidder_id },
          });
        }

        if (paid_items.length) {
          const paid_items_total_price = paid_items.reduce(
            computeTotalPrice,
            0,
          );

          await tx.receipt_records.create({
            data: {
              receipt_number: `${bidder.bidder.bidder_number}REF`,
              auction_bidder_id: data.auction_bidder_id,
              purpose: "REFUNDED",
              remarks: data.reason,
              payments: {
                create: {
                  amount_paid: paid_items_total_price,
                  payment_method_id: cash_payment_method?.payment_method_id,
                },
              },
              inventory_histories: {
                createMany: {
                  data: paid_items.map((paid_item) => ({
                    auction_inventory_id: paid_item.auction_inventory_id,
                    inventory_id: paid_item.inventory_id,
                    auction_status: "CANCELLED",
                    inventory_status: "UNSOLD",
                    remarks: buildRefundedHistoryRemark(
                      {
                        bidder_number: bidder.bidder.bidder_number,
                        bidder_name: `${bidder.bidder.first_name} ${bidder.bidder.last_name}`,
                      },
                      data.reason,
                      updated_by,
                    ),
                  })),
                },
              },
            },
          });
        }

        const atc_default_bidder = await tx.auctions_bidders.findFirst({
          where: {
            auction_id: bidder.auction_id,
            bidder: { bidder_number: ATC_DEFAULT_BIDDER_NUMBER },
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
                  remarks: buildCancelledHistoryRemark(
                    {
                      bidder_number: bidder.bidder.bidder_number,
                      bidder_name: `${bidder.bidder.first_name} ${bidder.bidder.last_name}`,
                    },
                    data.reason,
                    updated_by,
                  ),
                },
              }),
            ),
          );
        }

        return {
          bidder_number: bidder.bidder.bidder_number,
          first_name: bidder.bidder.first_name,
          last_name: bidder.bidder.last_name,
        };
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
      const counter_check_records = await prisma.counter_check.createMany({
        data: data.map((item) => ({
          auction_id,
          control: item.CONTROL,
          price: item.PRICE.toString(),
          page: item.PAGE,
          description: item.DESCRIPTION.toString(),
          time: item.TIME,
          bidder_number: item.BIDDER,
        })),
      });

      return counter_check_records;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error uploading counter check", {
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
        throw new DatabaseOperationError(
          "Error getting counter check records",
          {
            cause: error.message,
          },
        );
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
          remarks: data.remarks,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating counter check", {
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

          const rows_for_existing_auction_inventory =
            valid_rows_in_sheet.filter((item) => item.auction_inventory_id);
          const rows_for_new_auction_inventory = valid_rows_in_sheet.filter(
            (item) => !item.auction_inventory_id,
          );

          // insert newly created_inventories
          const for_creating_inventories =
            rows_for_new_auction_inventory.filter(
              (item) => !item.inventory_id && item.container_id,
            );

          if (for_creating_inventories.length) {
            await tx.inventories.createMany({
              data: for_creating_inventories.map((item) => ({
                container_id: item.container_id!,
                control: item.control,
                barcode: item.barcode,
                description: item.description,
                status: "SOLD",
                auction_date: auction.created_at,
              })),
            });
          }

          const newly_created_inventories = await tx.inventories.findMany({
            where: {
              barcode: {
                in: for_creating_inventories.map((item) => item.barcode),
              },
            },
          });

          const auction_inventories = valid_rows_in_sheet.map((item) => {
            const match = newly_created_inventories.find((inventory) => {
              if (item.barcode.length === 3) {
                return item.barcode === inventory.barcode;
              } else {
                return (
                  item.barcode === inventory.barcode &&
                  item.control === inventory.control
                );
              }
            });
            if (!item.auction_bidder_id) {
              throw new Error("Auction Bidder ID does not exist");
            }
            item.inventory_id = item.inventory_id ?? match?.inventory_id;
            return item as Override<
              UpdateManifestInput,
              {
                auction_bidder_id: string;
                inventory_id: string;
                service_charge: number;
              }
            >;
          });

          const created_auctions_inventories = await Promise.all(
            auction_inventories
              .filter((item) => !item.auction_inventory_id)
              .map((item) =>
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
                    is_slash_item: item.isSlashItem,
                  },
                }),
              ),
          );

          if (rows_for_existing_auction_inventory.length) {
            await tx.inventories.updateMany({
              data: {
                status: "SOLD",
                auction_date: auction.created_at,
              },
              where: {
                inventory_id: {
                  in: rows_for_existing_auction_inventory
                    .map((item) => item.inventory_id)
                    .filter((inventory_id): inventory_id is string =>
                      Boolean(inventory_id),
                    ),
                },
              },
            });

            await Promise.all(
              auction_inventories
                .filter(
                  (
                    item,
                  ): item is typeof item & { auction_inventory_id: string } =>
                    Boolean(item.auction_inventory_id),
                )
                .map((item) =>
                  tx.auctions_inventories.update({
                    data: {
                      auction_bidder_id: item.auction_bidder_id,
                      inventory_id: item.inventory_id,
                      description: item.description,
                      price: parseInt(item.price, 10),
                      qty: item.qty,
                      manifest_number: item.manifest_number as string,
                      status: "UNPAID",
                      auction_date: auction.created_at,
                      is_slash_item: item.isSlashItem,
                    },
                    where: {
                      auction_inventory_id: item.auction_inventory_id,
                    },
                  }),
                ),
            );
          }

          const auctions_inventories = await tx.auctions_inventories.findMany({
            include: { histories: true },
            where: {
              auction_inventory_id: {
                in: [
                  ...created_auctions_inventories.map(
                    (item) => item.auction_inventory_id as string,
                  ),
                  ...auction_inventories
                    .map((item) => item.auction_inventory_id)
                    .filter(
                      (auction_inventory_id): auction_inventory_id is string =>
                        Boolean(auction_inventory_id),
                    ),
                ],
              },
            },
          });
          await tx.inventory_histories.createMany({
            data: auction_inventories.map((item) => ({
              auction_inventory_id: item.auction_inventory_id,
              inventory_id: item.inventory_id,
              auction_status: "UNPAID",
              inventory_status: "SOLD",
              remarks:
                item.auction_inventory_id && item.status
                  ? buildManifestReencodedHistoryRemark(item.status)
                  : buildEncodedHistoryRemark(),
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
            {},
          );
          await Promise.all(
            Object.entries(update_balance).map(([auction_bidder_id, amount]) =>
              tx.auctions_bidders.update({
                where: { auction_bidder_id },
                data: { balance: { increment: amount } },
              }),
            ),
          );

          return manifest;
        },
        { maxWait: 10000, timeout: 30000 },
      );
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating manifest", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updateBidderRegistration: async (auction_bidder_id, data) => {
    try {
      const bidder = await prisma.auctions_bidders.findFirst({
        where: { auction_bidder_id },
      });

      if (!bidder) {
        throw new NotFoundError("AUCTION BIDDER NOT FOUND!");
      }

      return await prisma.$transaction(async (tx) => {
        const auction_bidder = await tx.auctions_bidders.findFirst({
          where: { auction_bidder_id },
          include: {
            auctions_inventories: {
              include: { histories: true },
              where: { status: { in: ["UNPAID", "PARTIAL"] } },
            },
          },
        });

        if (!auction_bidder) {
          throw new NotFoundError("Bidder not found!");
        }

        const registration_receipt = await tx.receipt_records.findFirst({
          include: { payments: true },
          where: { auction_bidder_id, receipt_number: { contains: "REG" } },
        });

        if (!registration_receipt) {
          throw new NotFoundError("Registration Receipt not found!");
        }

        await tx.payments.update({
          where: { payment_id: registration_receipt.payments[0].payment_id },
          data: { amount_paid: data.registration_fee },
        });

        const totalUnpaidItemsPrice = auction_bidder.auctions_inventories
          .filter((item) => ["UNPAID", "PARTIAL"].includes(item.status))
          .map((item) => {
            if (item.status === "UNPAID") return item;

            const discrepancyHistory = item.histories.find(
              (history) => history.auction_status === "DISCREPANCY",
            );
            const partialPrice =
              resolvePartialBalancePriceFromLegacyHistoryRemark(
                discrepancyHistory?.remarks,
              );

            if (typeof partialPrice === "number") {
              item.price = partialPrice;
            }

            return item;
          })
          .reduce((acc, item) => (acc += item.price), 0);

        const serviceChargeAmount =
          (totalUnpaidItemsPrice * data.service_charge) / 100;
        const registrationFeeAmount = auction_bidder.already_consumed
          ? 0
          : data.registration_fee;

        const grandTotalBalance =
          totalUnpaidItemsPrice + serviceChargeAmount - registrationFeeAmount;

        return await tx.auctions_bidders.update({
          where: { auction_bidder_id },
          data: {
            service_charge: data.service_charge,
            registration_fee: data.registration_fee,
            balance: grandTotalBalance,
          },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error registering bidder", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  unregisterBidder: async (auction_bidder_id) => {
    try {
      const bidder = await prisma.auctions_bidders.findFirst({
        where: { auction_bidder_id },
      });

      if (!bidder) {
        throw new NotFoundError("AUCTION BIDDER NOT FOUND!");
      }

      return await prisma.$transaction(async (tx) => {
        await tx.payments.deleteMany({
          where: {
            receipt: { auction_bidder_id },
          },
        });

        await tx.receipt_records.deleteMany({
          where: { auction_bidder: { auction_bidder_id } },
        });

        await tx.auctions_bidders.delete({
          where: { auction_bidder_id },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        logger("AuctionRepository.unregisterBidder", error);
        throw new DatabaseOperationError("Error unregistering bidder!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getAuctionsByBranch: async (branch_id) => {
    try {
      return await prisma.auctions.findMany({
        where: { branch_id },
        include: { registered_bidders: { include: { bidder: true } } },
        orderBy: { created_at: "desc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching Auctions", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
