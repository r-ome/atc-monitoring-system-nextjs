import prisma from "@/app/lib/prisma/prisma";
import { buildTenantWhere } from "@/app/lib/prisma/tenant-where";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IInventoryRepository } from "src/application/repositories/inventories.repository.interface";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import {
  getItemPriceWithServiceChargeAmount,
  normalizeControl,
} from "@/app/lib/utils";
import {
  buildItemMergedHistoryRemark,
  buildItemSplitBoughtHistoryRemark,
  buildItemVoidedHistoryRemark,
  buildItemDirectBoughtHistoryRemark,
  buildItemUpdatedHistoryRemark,
} from "src/entities/models/InventoryHistoryRemark";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { getAuctionInventoriesPayableBase } from "src/entities/models/AuctionPayableAmount";

export const InventoryRepository: IInventoryRepository = {
  getAuctionItemDetails: async (auction_inventory_id) => {
    try {
      return await prisma.auctions_inventories.findFirst({
        where: { auction_inventory_id },
        include: {
          receipt: { include: { payments: true } },
          inventory: {
            include: {
              container: { select: { container_id: true, barcode: true } },
            },
          },
          auction_bidder: { include: { bidder: true } },
          histories: {
            include: { receipt: true },
            orderBy: { created_at: "desc" },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        logger("InventoryRepository.getAuctionItemDetails", error);
        throw new DatabaseOperationError("Error getting Auction Item details!");
      }
      throw error;
    }
  },
  searchAuctionItems: async ({ input, offset, limit }) => {
    try {
      const isContainerBarcodeSearch =
        input.mode === "barcode" && input.barcode?.split("-").length === 2;
      const searchWhere =
        input.mode === "description"
          ? {
              OR: [
                { description: { contains: input.description } },
                { inventory: { description: { contains: input.description } } },
              ],
            }
          : {
              inventory:
                input.mode === "barcode"
                  ? isContainerBarcodeSearch
                    ? {
                        OR: [
                          { barcode: input.barcode },
                          { barcode: { startsWith: `${input.barcode}-` } },
                        ],
                      }
                    : { barcode: input.barcode }
                  : input.mode === "control"
                    ? { control: normalizeControl(input.control) }
                    : {
                        barcode: input.barcode,
                        control: normalizeControl(input.control),
                      },
            };

      return await prisma.auctions_inventories.findMany({
        where: buildTenantWhere("auctions_inventories", searchWhere),
        include: {
          inventory: true,
          auction_bidder: { include: { bidder: true } },
        },
        orderBy: [{ auction_date: "desc" }, { created_at: "desc" }],
        skip: offset,
        take: limit + 1,
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        logger("InventoryRepository.searchAuctionItems", error);
        throw new DatabaseOperationError("Error searching auction items!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getUnsoldInventories: async () => {
    try {
      return await prisma.inventories.findMany({
        where: { status: { in: ["UNSOLD", "BOUGHT_ITEM"] } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error fetching unsold inventories", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updateAuctionItem: async (data, updated_by?) => {
    try {
      await prisma.$transaction(async (tx) => {
        const syncAuctionBidderBalance = async (auction_bidder_id: string) => {
          const bidder = await tx.auctions_bidders.findFirst({
            where: { auction_bidder_id },
            include: {
              auctions_inventories: {
                include: {
                  histories: {
                    orderBy: { created_at: "desc" },
                  },
                },
              },
            },
          });

          if (!bidder) {
            return;
          }

          const totalUnpaidItemsPrice = getAuctionInventoriesPayableBase(
            bidder.auctions_inventories,
          );

          const serviceChargeAmount =
            (totalUnpaidItemsPrice * bidder.service_charge) / 100;
          const registrationFeeAmount = bidder.already_consumed
            ? 0
            : bidder.registration_fee;

          await tx.auctions_bidders.update({
            where: { auction_bidder_id },
            data: {
              balance:
                totalUnpaidItemsPrice +
                serviceChargeAmount -
                registrationFeeAmount,
            },
          });
        };

        const selected_bidder = await tx.auctions_bidders.findFirst({
          where: {
            auction_id: data.auction_id,
            bidder: { bidder_number: data.bidder_number },
          },
        });

        if (!selected_bidder?.auction_bidder_id) {
          throw new NotFoundError("Selected Bidder doesn't exist!", {
            cause: "Selected bidder doesn't exist!",
          });
        }

        const auction_inventory = await tx.auctions_inventories.findFirst({
          where: { auction_inventory_id: data.auction_inventory_id },
          include: {
            inventory: true,
            auction_bidder: { include: { bidder: true } },
          },
        });

        if (!auction_inventory) {
          throw new NotFoundError("Auction Inventory does not exist!");
        }

        const is_item_reassigned =
          auction_inventory.auction_bidder_id !==
          selected_bidder.auction_bidder_id;

        let auction_inventory_status = auction_inventory.status;
        if (
          is_item_reassigned &&
          ["REFUNDED", "CANCELLED"].includes(auction_inventory_status)
        ) {
          auction_inventory_status = "UNPAID";
        }

        if (auction_inventory_status === "UNPAID") {
          const previous_bidder = await tx.auctions_bidders.findFirst({
            where: {
              auction_bidder_id: auction_inventory?.auction_bidder_id,
            },
          });

          if (!previous_bidder) {
            throw new NotFoundError("Previous Bidder does not exist!");
          }
          const prev_bidder_service_charge_amount =
            (auction_inventory?.price * previous_bidder.service_charge) / 100;

          if (is_item_reassigned) {
            const new_bidder_computed_price =
              getItemPriceWithServiceChargeAmount(
                data.price,
                selected_bidder.service_charge,
              );
            // update new bidder's balance (add new price)
            await tx.auctions_bidders.update({
              where: { auction_bidder_id: selected_bidder?.auction_bidder_id },
              data: { balance: { increment: new_bidder_computed_price } },
            });

            const prev_bidder_computed_price =
              prev_bidder_service_charge_amount + data.price;

            // update previous bidder's balance (deduct, if item is reassigned)
            await tx.auctions_bidders.update({
              where: {
                auction_bidder_id: auction_inventory?.auction_bidder_id,
              },
              data: { balance: { decrement: prev_bidder_computed_price } },
            });
          } else {
            const item_new_price = getItemPriceWithServiceChargeAmount(
              data.price,
              previous_bidder.service_charge,
            );

            const item_current_price =
              prev_bidder_service_charge_amount + auction_inventory.price;

            const prev_bidder_new_balance =
              previous_bidder.balance - item_current_price + item_new_price;

            // update previous bidder's balance (deduct or add based on item's new price)
            await tx.auctions_bidders.update({
              where: {
                auction_bidder_id: auction_inventory?.auction_bidder_id,
              },
              data: { balance: prev_bidder_new_balance },
            });
          }
        }

        // if item that is updated has a higher price compared to previous price
        if (
          auction_inventory_status === "PAID" &&
          data.price > auction_inventory.price
        ) {
          auction_inventory_status = "PARTIAL";
          const new_computed_price = getItemPriceWithServiceChargeAmount(
            data.price - auction_inventory.price,
            selected_bidder.service_charge,
          );

          // update new bidder's balance (add new price)
          await tx.auctions_bidders.update({
            where: { auction_bidder_id: selected_bidder?.auction_bidder_id },
            data: { balance: { increment: new_computed_price } },
          });
        }

        const previous_values: Record<string, string | number | null> = {
          barcode: auction_inventory.inventory.barcode,
          control: auction_inventory.inventory.control,
          description: auction_inventory.description,
          price: auction_inventory.price,
          qty: auction_inventory.qty,
          manifest_number: auction_inventory.manifest_number,
          bidder_number: auction_inventory.auction_bidder.bidder.bidder_number,
        };

        const remarks = Object.keys(previous_values)
          .map((item) => {
            const new_data = data[item as keyof typeof data];
            if (previous_values[item] === new_data) return null;

            switch (item) {
              case "price":
                return `Price: ${previous_values[item]} → ${new_data}`;
              case "bidder_number":
                return `Bidder: #${previous_values[item]} → #${new_data}`;
              case "qty":
                return `Qty: ${previous_values[item]} → ${new_data}`;
              case "manifest_number":
                return `Manifest number: ${previous_values[item]} → ${new_data}`;
              case "barcode":
                return `Barcode: ${previous_values[item]} → ${new_data}`;
              case "control":
                return `Control: ${previous_values[item]} → ${new_data}`;
              case "description":
                return `Description: ${previous_values[item]} → ${new_data}`;
              default:
                return `${item}: ${previous_values[item]} → ${new_data}`;
            }
          })
          .filter((item): item is string => Boolean(item));

        await tx.auctions_inventories.update({
          where: { auction_inventory_id: data.auction_inventory_id },
          data: {
            auction_bidder: {
              connect: { auction_bidder_id: selected_bidder.auction_bidder_id },
            },
            price: data.price,
            description: data.description,
            qty: data.qty,
            status: auction_inventory_status,
            manifest_number: data.manifest_number
              ? data?.manifest_number
              : undefined,
            inventory: {
              update: {
                container_id:
                  data.container_id !== auction_inventory.inventory.container_id
                    ? data.container_id!
                    : auction_inventory.inventory.container_id,
                barcode: data.barcode,
                control: normalizeControl(data.control),
                status: "SOLD",
              },
            },
            histories: {
              create: {
                inventory_id: data.inventory_id,
                auction_status: "DISCREPANCY",
                inventory_status: "SOLD",
                remarks: buildItemUpdatedHistoryRemark({
                  changes: remarks,
                  updated_by,
                }),
              },
            },
          },
        });

        const affectedBidderIds = new Set([
          auction_inventory.auction_bidder_id,
          selected_bidder.auction_bidder_id,
        ]);

        await Promise.all(
          Array.from(affectedBidderIds).map((auction_bidder_id) =>
            syncAuctionBidderBalance(auction_bidder_id),
          ),
        );
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating item!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  resolveFinalReportMatches: async (data, updated_by?) => {
    try {
      await prisma.$transaction(async (tx) => {
        const syncAuctionBidderBalance = async (auction_bidder_id: string) => {
          const bidder = await tx.auctions_bidders.findFirst({
            where: { auction_bidder_id },
            include: {
              auctions_inventories: {
                include: {
                  histories: {
                    orderBy: { created_at: "desc" },
                  },
                },
              },
            },
          });

          if (!bidder) return;

          const totalUnpaidItemsPrice = getAuctionInventoriesPayableBase(
            bidder.auctions_inventories,
          );
          const serviceChargeAmount =
            (totalUnpaidItemsPrice * bidder.service_charge) / 100;
          const registrationFeeAmount = bidder.already_consumed
            ? 0
            : bidder.registration_fee;

          await tx.auctions_bidders.update({
            where: { auction_bidder_id },
            data: {
              balance:
                totalUnpaidItemsPrice +
                serviceChargeAmount -
                registrationFeeAmount,
            },
          });
        };

        for (const match of data.matches) {
          if (match.source_inventory_id === match.target_inventory_id) {
            throw new NotFoundError("Source and target inventory must differ.");
          }

          const auctionInventory = await tx.auctions_inventories.findFirst({
            where: { auction_inventory_id: match.auction_inventory_id },
            include: {
              inventory: true,
              auction_bidder: true,
            },
          });

          if (!auctionInventory) {
            throw new NotFoundError("Auction inventory not found.");
          }

          if (auctionInventory.inventory_id !== match.source_inventory_id) {
            throw new NotFoundError("Auction inventory source does not match.");
          }

          if (auctionInventory.inventory.barcode.split("-").length !== 2) {
            throw new NotFoundError("Only two-part monitoring rows can be resolved.");
          }

          const targetInventory = await tx.inventories.findFirst({
            where: { inventory_id: match.target_inventory_id },
            include: { auctions_inventory: true },
          });

          if (!targetInventory) {
            throw new NotFoundError("Target inventory not found.");
          }

          if (targetInventory.status !== "UNSOLD") {
            throw new NotFoundError("Target inventory is no longer UNSOLD.");
          }

          if (targetInventory.auctions_inventory) {
            throw new NotFoundError("Target inventory is already linked to an auction item.");
          }

          await tx.inventory_histories.updateMany({
            where: { inventory_id: match.source_inventory_id },
            data: { inventory_id: match.target_inventory_id },
          });

          await tx.auctions_inventories.update({
            where: { auction_inventory_id: match.auction_inventory_id },
            data: {
              inventory_id: match.target_inventory_id,
              description: match.description,
              price: match.price,
              qty: match.qty,
            },
          });

          await tx.inventories.update({
            where: { inventory_id: match.target_inventory_id },
            data: {
              status: "SOLD",
              auction_date: auctionInventory.auction_date,
            },
          });

          await tx.inventory_histories.create({
            data: {
              auction_inventory_id: match.auction_inventory_id,
              inventory_id: match.target_inventory_id,
              auction_status: "DISCREPANCY",
              inventory_status: "SOLD",
              remarks: buildItemUpdatedHistoryRemark({
                changes: [
                  `Final report match: ${auctionInventory.inventory.barcode} -> ${targetInventory.barcode}`,
                ],
                updated_by,
              }),
            },
          });

          await tx.inventories.delete({
            where: { inventory_id: match.source_inventory_id },
          });

          await syncAuctionBidderBalance(auctionInventory.auction_bidder_id);
        }
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error resolving final report matches!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  resolveFinalReportCounterCheckMatches: async (data, updated_by?) => {
    try {
      await prisma.$transaction(async (tx) => {
        const syncAuctionBidderBalance = async (auction_bidder_id: string) => {
          const bidder = await tx.auctions_bidders.findFirst({
            where: { auction_bidder_id },
            include: {
              auctions_inventories: {
                include: { histories: { orderBy: { created_at: "desc" } } },
              },
            },
          });
          if (!bidder) return;
          const totalUnpaidItemsPrice = getAuctionInventoriesPayableBase(
            bidder.auctions_inventories,
          );
          const serviceChargeAmount =
            (totalUnpaidItemsPrice * bidder.service_charge) / 100;
          const registrationFeeAmount = bidder.already_consumed
            ? 0
            : bidder.registration_fee;
          await tx.auctions_bidders.update({
            where: { auction_bidder_id },
            data: {
              balance:
                totalUnpaidItemsPrice +
                serviceChargeAmount -
                registrationFeeAmount,
            },
          });
        };

        for (const match of data.matches) {
          const bidder = await tx.auctions_bidders.findFirst({
            where: { auction_bidder_id: match.auction_bidder_id },
          });
          if (!bidder) {
            throw new NotFoundError("Auction bidder not found.");
          }

          const counterCheck = await tx.counter_check.findFirst({
            where: { counter_check_id: match.counter_check_id },
          });
          if (!counterCheck) {
            throw new NotFoundError("Counter-check record not found.");
          }

          const targetInventory = await tx.inventories.findFirst({
            where: { inventory_id: match.inventory_id },
            include: { auctions_inventory: true },
          });
          if (!targetInventory) {
            throw new NotFoundError("Target inventory not found.");
          }
          if (targetInventory.status !== "UNSOLD") {
            throw new NotFoundError("Target inventory is no longer UNSOLD.");
          }
          if (targetInventory.auctions_inventory) {
            throw new NotFoundError(
              "Target inventory is already linked to an auction item.",
            );
          }

          const auctionDate = new Date(match.auction_date);

          const created = await tx.auctions_inventories.create({
            data: {
              auction_bidder_id: match.auction_bidder_id,
              inventory_id: match.inventory_id,
              description: match.description,
              status: "UNPAID",
              price: match.price,
              qty: match.qty,
              manifest_number: match.manifest_number,
              auction_date: auctionDate,
            },
          });

          await tx.inventories.update({
            where: { inventory_id: match.inventory_id },
            data: { status: "SOLD", auction_date: auctionDate },
          });

          await tx.inventory_histories.create({
            data: {
              auction_inventory_id: created.auction_inventory_id,
              inventory_id: match.inventory_id,
              auction_status: "UNPAID",
              inventory_status: "SOLD",
              remarks: buildItemUpdatedHistoryRemark({
                changes: [
                  `Final report counter-check match (counter_check ${counterCheck.counter_check_id})`,
                ],
                updated_by,
              }),
            },
          });

          await syncAuctionBidderBalance(match.auction_bidder_id);
        }
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error resolving final report counter-check matches!",
          { cause: error.message },
        );
      }
      throw error;
    }
  },
  createFinalReportAddOns: async (data, updated_by?) => {
    try {
      await prisma.$transaction(async (tx) => {
        const syncAuctionBidderBalance = async (auction_bidder_id: string) => {
          const bidder = await tx.auctions_bidders.findFirst({
            where: { auction_bidder_id },
            include: {
              auctions_inventories: {
                include: { histories: { orderBy: { created_at: "desc" } } },
              },
            },
          });
          if (!bidder) return;
          const totalUnpaidItemsPrice = getAuctionInventoriesPayableBase(
            bidder.auctions_inventories,
          );
          const serviceChargeAmount =
            (totalUnpaidItemsPrice * bidder.service_charge) / 100;
          const registrationFeeAmount = bidder.already_consumed
            ? 0
            : bidder.registration_fee;
          await tx.auctions_bidders.update({
            where: { auction_bidder_id },
            data: {
              balance:
                totalUnpaidItemsPrice +
                serviceChargeAmount -
                registrationFeeAmount,
            },
          });
        };

        const touchedBidderIds = new Set<string>();

        for (const item of data.items) {
          const bidder = await tx.auctions_bidders.findFirst({
            where: { auction_bidder_id: item.auction_bidder_id },
          });
          if (!bidder) {
            throw new NotFoundError("Auction bidder not found.");
          }

          const targetInventory = await tx.inventories.findFirst({
            where: { inventory_id: item.inventory_id },
            include: { auctions_inventory: true },
          });
          if (!targetInventory) {
            throw new NotFoundError("Target inventory not found.");
          }
          if (targetInventory.status !== "UNSOLD") {
            throw new NotFoundError("Target inventory is no longer UNSOLD.");
          }
          if (targetInventory.auctions_inventory) {
            throw new NotFoundError(
              "Target inventory is already linked to an auction item.",
            );
          }

          const auctionDate = new Date(item.auction_date);

          const created = await tx.auctions_inventories.create({
            data: {
              auction_bidder_id: item.auction_bidder_id,
              inventory_id: item.inventory_id,
              description: item.description,
              status: "UNPAID",
              price: item.price,
              qty: item.qty,
              manifest_number: item.manifest_number,
              auction_date: auctionDate,
            },
          });

          await tx.inventories.update({
            where: { inventory_id: item.inventory_id },
            data: { status: "SOLD", auction_date: auctionDate },
          });

          await tx.inventory_histories.create({
            data: {
              auction_inventory_id: created.auction_inventory_id,
              inventory_id: item.inventory_id,
              auction_status: "UNPAID",
              inventory_status: "SOLD",
              remarks: buildItemUpdatedHistoryRemark({
                changes: ["Final report Add-On"],
                updated_by,
              }),
            },
          });

          touchedBidderIds.add(item.auction_bidder_id);
        }

        for (const auction_bidder_id of touchedBidderIds) {
          await syncAuctionBidderBalance(auction_bidder_id);
        }
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error creating final report add-ons!",
          { cause: error.message },
        );
      }
      throw error;
    }
  },
  getInventory: async (inventory_id) => {
    try {
      const inventory = await prisma.inventories.findFirst({
        where: { inventory_id },
        include: {
          histories: {
            include: { receipt: true },
            orderBy: { created_at: "desc" },
          },
          container: true,
          auctions_inventory: {
            include: { receipt: true, auction_bidder: true },
          },
        },
      });

      if (!inventory) {
        throw new NotFoundError("Inventory not found!");
      }

      return inventory;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting Inventory!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updateInventory: async (inventory_id, data) => {
    try {
      const existingInventory = await prisma.inventories.findFirst({
        where: buildTenantWhere("inventories", { inventory_id }),
        select: { inventory_id: true },
      });

      if (!existingInventory) {
        throw new NotFoundError("Inventory not found!");
      }

      const updated = await prisma.inventories.update({
        where: { inventory_id },
        data: {
          barcode: data.barcode,
          control: normalizeControl(data.control),
          description: data.description,
        },
      });

      return updated;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating inventory!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getAllInventories: async (
    status = ["SOLD", "BOUGHT_ITEM", "UNSOLD"],
  ) => {
    try {
      return await prisma.inventories.findMany({
        where: { status: { in: status } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting all inventories", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getAllInventoriesForManifest: async (
    status = ["SOLD", "BOUGHT_ITEM", "UNSOLD"],
  ) => {
    try {
      return await prisma.inventories.findMany({
        where: { status: { in: status }, deleted_at: null },
        select: {
          inventory_id: true,
          container_id: true,
          barcode: true,
          control: true,
          status: true,
          auction_date: true,
          auctions_inventory: {
            select: {
              auction_bidder: {
                select: {
                  auction_id: true,
                  bidder: {
                    select: {
                      bidder_number: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting inventories for manifest", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  updateBulkInventoryStatus: async (status, inventory_ids) => {
    try {
      return await prisma.inventories.updateMany({
        where: { inventory_id: { in: inventory_ids } },
        data: { status },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating bulk inventories", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getBoughtItems: async (params: {
    year: string;
    month?: string;
    view?: string;
    branchId: string;
  }) => {
    const year = Number(params.year);
    const isYearlyView = params.view === "yearly";
    const month = Number(params.month ?? 0);
    const start = isYearlyView ? new Date(year, 0, 1) : new Date(year, month, 1);
    const end = isYearlyView ? new Date(year + 1, 0, 1) : new Date(year, month + 1, 1);
    try {
      return await prisma.inventories.findMany({
        where: {
          is_bought_item: { not: null, gt: 0 },
          auction_date: { gte: start, lt: end },
          container: { branch_id: params.branchId },
        },
        include: {
          auctions_inventory: {
            include: { auction_bidder: { include: { bidder: true } } },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting bought items", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getInventoryWithNoAuctionInventory: async () => {
    try {
      return await prisma.inventories.findMany({
        include: { auctions_inventory: true },
        where: { auctions_inventory: { is: null } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error getting inventories with no auction inventories",
          {
            cause: error.message,
          },
        );
      }
      throw error;
    }
  },
  createInventory: async (input) => {
    try {
      return await prisma.inventories.create({
        data: {
          container_id: input.container_id,
          barcode: input.barcode,
          control: normalizeControl(input.control),
          description: input.description,
          status: "UNSOLD",
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating inventory", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  mergeInventories: async (data) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const [
          old_inventory,
          new_inventory,
          old_auction_inventory,
          new_auction_inventory,
        ] = await Promise.all([
          tx.inventories.findFirst({
            where: buildTenantWhere("inventories", {
              inventory_id: data.old_inventory_id,
            }),
          }),
          tx.inventories.findFirst({
            where: buildTenantWhere("inventories", {
              inventory_id: data.new_inventory_id,
            }),
            include: {
              container: { select: { barcode: true } },
            },
          }),
          tx.auctions_inventories.findFirst({
            where: buildTenantWhere("auctions_inventories", {
              inventory_id: data.old_inventory_id,
            }),
            include: {
              auction_bidder: {
                include: {
                  bidder: { select: { bidder_number: true } },
                },
              },
            },
          }),
          tx.auctions_inventories.findFirst({
            where: buildTenantWhere("auctions_inventories", {
              inventory_id: data.new_inventory_id,
            }),
            include: {
              auction_bidder: {
                include: {
                  bidder: { select: { bidder_number: true } },
                },
              },
            },
          }),
        ]);

        if (!old_inventory || !new_inventory || !old_auction_inventory) {
          throw new NotFoundError("Inventory / Auction inventory not found!");
        }

        await tx.inventory_histories.updateMany({
          where: { inventory_id: data.old_inventory_id },
          data: { inventory_id: data.new_inventory_id },
        });

        const autoInherit =
          new_inventory.control === "0000" || new_inventory.control === "00NC";
        const finalControl =
          autoInherit || data.control_choice === "SOLD"
            ? old_inventory.control
            : new_inventory.control;

        await tx.inventories.update({
          where: { inventory_id: data.new_inventory_id },
          data: {
            status: "SOLD",
            control: finalControl,
            auction_date: old_auction_inventory.auction_date,
          },
        });

        await tx.inventory_histories.create({
          data: {
            auction_inventory_id: old_auction_inventory.auction_inventory_id,
            inventory_id: data.new_inventory_id,
            auction_status: "DISCREPANCY",
            inventory_status: "SOLD",
            remarks: buildItemMergedHistoryRemark({
              unsold_barcode: new_inventory.barcode,
              unsold_control: new_inventory.control ?? "NC",
              sold_barcode: old_inventory.barcode,
              sold_control: old_inventory.control ?? "NC",
            }),
          },
        });

        // If the surviving inventory already has an auction record (e.g. CANCELLED/REFUNDED),
        // remove it before relinking the SOLD item's record.
        if (new_auction_inventory) {
          await tx.auctions_inventories.delete({
            where: { inventory_id: data.new_inventory_id },
          });
        }

        // Relink the SOLD item's auction record to the surviving (3-part) inventory.
        await tx.auctions_inventories.update({
          where: { inventory_id: data.old_inventory_id },
          data: { inventory_id: data.new_inventory_id },
        });

        // Soft-delete the old 2-part inventory so its barcode remains discoverable.
        await tx.inventories.update({
          where: { inventory_id: data.old_inventory_id },
          data: {
            deleted_at: new Date(),
            description: `MERGED INTO: ${new_inventory.barcode} (ctrl: ${finalControl ?? "NC"})`,
          },
        });

        return {
          merged_into_barcode: new_inventory.container.barcode,
          items: [
            {
              barcode: old_inventory.barcode,
              control: old_inventory.control ?? "NC",
              description:
                old_auction_inventory.description ?? old_inventory.description,
              price: old_auction_inventory.price.toString(),
              bidder_number:
                old_auction_inventory.auction_bidder.bidder.bidder_number,
            },
            {
              barcode: new_inventory.barcode,
              control: new_inventory.control ?? "NC",
              description:
                new_auction_inventory?.description ?? new_inventory.description,
              price: new_auction_inventory?.price.toString() ?? "",
              bidder_number:
                new_auction_inventory?.auction_bidder.bidder.bidder_number ?? "",
            },
          ],
        };
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error merging inventories", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  appendInventories: async (data) => {
    try {
      await prisma.$transaction(async (tx) => {
        const existingInventories = await tx.inventories.findMany({
          where: buildTenantWhere("inventories", {
            inventory_id: { in: data.map((inventory) => inventory.inventory_id) },
          }),
          select: { inventory_id: true },
        });

        if (existingInventories.length !== data.length) {
          throw new NotFoundError("One or more inventories were not found!");
        }

        await Promise.all(
          data.map((inventory) =>
            tx.inventories.update({
              where: { inventory_id: inventory.inventory_id },
              data: {
                barcode: inventory.barcode,
              },
            }),
          ),
        );
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error appending inventories", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  applySplitBoughtItems: async (data, updated_by?) => {
    try {
      await prisma.$transaction(async (tx) => {
        const sourceAuctionInventory = await tx.auctions_inventories.findFirst({
          where: { auction_inventory_id: data.source_auction_inventory_id },
          include: {
            auction_bidder: { select: { auction_id: true } },
            inventory: { select: { barcode: true, control: true } },
          },
        });
        if (!sourceAuctionInventory) {
          throw new NotFoundError("Source auction inventory not found.");
        }

        const atcBidder = await tx.auctions_bidders.findFirst({
          where: {
            auction_id: sourceAuctionInventory.auction_bidder.auction_id,
            bidder: { bidder_number: ATC_DEFAULT_BIDDER_NUMBER },
          },
        });
        if (!atcBidder) {
          throw new NotFoundError("ATC bidder not registered on this auction.");
        }

        for (const split of data.splits) {
          const targetInventory = await tx.inventories.findFirst({
            where: { inventory_id: split.target_inventory_id },
            include: { auctions_inventory: true },
          });
          if (!targetInventory) {
            throw new NotFoundError(`Target inventory ${split.target_inventory_id} not found.`);
          }
          if (targetInventory.status !== "UNSOLD") {
            throw new NotFoundError(`Target inventory ${targetInventory.barcode} is no longer UNSOLD.`);
          }
          if (targetInventory.auctions_inventory) {
            throw new NotFoundError(`Target inventory ${targetInventory.barcode} already has an auction record.`);
          }

          const created = await tx.auctions_inventories.create({
            data: {
              auction_bidder_id: atcBidder.auction_bidder_id,
              inventory_id: split.target_inventory_id,
              description: targetInventory.description,
              status: "UNPAID",
              price: split.price,
              qty: split.qty,
              manifest_number: "BOUGHT ITEM",
              auction_date: sourceAuctionInventory.auction_date,
              split_from_auction_inventory_id: data.source_auction_inventory_id,
            },
          });

          await tx.inventories.update({
            where: { inventory_id: split.target_inventory_id },
            data: {
              status: "BOUGHT_ITEM",
              auction_date: sourceAuctionInventory.auction_date,
            },
          });

          await tx.inventory_histories.create({
            data: {
              auction_inventory_id: created.auction_inventory_id,
              inventory_id: split.target_inventory_id,
              auction_status: "UNPAID",
              inventory_status: "BOUGHT_ITEM",
              remarks: buildItemSplitBoughtHistoryRemark({
                source_barcode: sourceAuctionInventory.inventory.barcode,
                source_control: sourceAuctionInventory.inventory.control ?? "NC",
                split_price: split.price,
                split_qty: split.qty,
              }),
            },
          });
        }

        // Sync ATC bidder balance
        const atcBidderWithItems = await tx.auctions_bidders.findFirst({
          where: { auction_bidder_id: atcBidder.auction_bidder_id },
          include: {
            auctions_inventories: {
              include: { histories: { orderBy: { created_at: "desc" } } },
            },
          },
        });
        if (atcBidderWithItems) {
          const totalUnpaidItemsPrice = getAuctionInventoriesPayableBase(
            atcBidderWithItems.auctions_inventories,
          );
          const serviceChargeAmount =
            (totalUnpaidItemsPrice * atcBidderWithItems.service_charge) / 100;
          const registrationFeeAmount = atcBidderWithItems.already_consumed
            ? 0
            : atcBidderWithItems.registration_fee;
          await tx.auctions_bidders.update({
            where: { auction_bidder_id: atcBidder.auction_bidder_id },
            data: {
              balance:
                totalUnpaidItemsPrice + serviceChargeAmount - registrationFeeAmount,
            },
          });
        }
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error applying qty split", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  applyVoidInventory: async (data, updated_by?) => {
    try {
      await prisma.$transaction(async (tx) => {
        const inventory = await tx.inventories.findFirst({
          where: buildTenantWhere("inventories", { inventory_id: data.inventory_id }),
        });
        if (!inventory) throw new NotFoundError("Inventory not found.");
        if (inventory.status !== "UNSOLD") {
          throw new NotFoundError("Inventory is no longer UNSOLD.");
        }

        await tx.inventories.update({
          where: { inventory_id: data.inventory_id },
          data: { status: "VOID" },
        });

        await tx.inventory_histories.create({
          data: {
            inventory_id: data.inventory_id,
            auction_status: "DISCREPANCY",
            inventory_status: "VOID",
            remarks: buildItemVoidedHistoryRemark(),
          },
        });
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error voiding inventory", { cause: error.message });
      }
      throw error;
    }
  },
  applyDirectBoughtItem: async (data, updated_by?) => {
    try {
      await prisma.$transaction(async (tx) => {
        const atcBidder = await tx.auctions_bidders.findFirst({
          where: {
            auction_id: data.auction_id,
            bidder: { bidder_number: ATC_DEFAULT_BIDDER_NUMBER },
          },
          select: { auction_bidder_id: true, service_charge: true, registration_fee: true, already_consumed: true },
        });
        if (!atcBidder) throw new NotFoundError("ATC bidder not registered on this auction.");

        const targetInventory = await tx.inventories.findFirst({
          where: { inventory_id: data.inventory_id },
          include: { auctions_inventory: true },
        });
        if (!targetInventory) throw new NotFoundError("Inventory not found.");
        if (targetInventory.status !== "UNSOLD") {
          throw new NotFoundError("Inventory is no longer UNSOLD.");
        }
        if (targetInventory.auctions_inventory) {
          throw new NotFoundError("Inventory already has an auction record.");
        }

        const auctionDate = new Date();

        const created = await tx.auctions_inventories.create({
          data: {
            auction_bidder_id: atcBidder.auction_bidder_id,
            inventory_id: data.inventory_id,
            description: targetInventory.description,
            status: "UNPAID",
            price: data.price,
            qty: data.qty,
            manifest_number: "BOUGHT ITEM",
            auction_date: auctionDate,
          },
        });

        await tx.inventories.update({
          where: { inventory_id: data.inventory_id },
          data: { status: "BOUGHT_ITEM", auction_date: auctionDate },
        });

        await tx.inventory_histories.create({
          data: {
            auction_inventory_id: created.auction_inventory_id,
            inventory_id: data.inventory_id,
            auction_status: "UNPAID",
            inventory_status: "BOUGHT_ITEM",
            remarks: buildItemDirectBoughtHistoryRemark({ price: data.price, qty: data.qty }),
          },
        });

        // Sync ATC bidder balance
        const atcBidderWithItems = await tx.auctions_bidders.findFirst({
          where: { auction_bidder_id: atcBidder.auction_bidder_id },
          include: {
            auctions_inventories: {
              include: { histories: { orderBy: { created_at: "desc" } } },
            },
          },
        });
        if (atcBidderWithItems) {
          const totalUnpaidItemsPrice = getAuctionInventoriesPayableBase(
            atcBidderWithItems.auctions_inventories,
          );
          const serviceChargeAmount =
            (totalUnpaidItemsPrice * atcBidderWithItems.service_charge) / 100;
          const registrationFeeAmount = atcBidderWithItems.already_consumed
            ? 0
            : atcBidderWithItems.registration_fee;
          await tx.auctions_bidders.update({
            where: { auction_bidder_id: atcBidder.auction_bidder_id },
            data: {
              balance: totalUnpaidItemsPrice + serviceChargeAmount - registrationFeeAmount,
            },
          });
        }
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error setting direct bought item", { cause: error.message });
      }
      throw error;
    }
  },
  deleteInventory: async (inventory_id) => {
    try {
      const existingInventory = await prisma.inventories.findFirst({
        where: buildTenantWhere("inventories", { inventory_id }),
        select: { inventory_id: true },
      });

      if (!existingInventory) {
        throw new NotFoundError("Inventory not found!");
      }

      await prisma.inventories.delete({ where: { inventory_id } });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting inventory", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
