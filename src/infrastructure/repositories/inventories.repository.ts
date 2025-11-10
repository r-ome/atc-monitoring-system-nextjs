import prisma from "@/app/lib/prisma/prisma";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IInventoryRepository } from "src/application/repositories/inventories.repository.interface";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";

export const InventoryRepository: IInventoryRepository = {
  getAuctionItemDetails: async (auction_inventory_id) => {
    try {
      return await prisma.auctions_inventories.findFirst({
        where: { auction_inventory_id },
        include: {
          receipt: { include: { payments: true } },
          inventory: { include: { container: true } },
          auction_bidder: { include: { bidder: true } },
          histories: {
            include: { receipt: true },
            orderBy: { created_at: "desc" },
          },
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        console.error(error.message);
        throw new DatabaseOperationError("Error getting Auction Item details!");
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
        throw new DatabaseOperationError("Error fetchign unsold inventories", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  voidItems: async (data) => {
    try {
      const auctions_inventory = await prisma.auctions_inventories.findFirst({
        where: {
          auction_inventory_id:
            data.auction_inventories[0].auction_inventory_id,
        },
        include: { auction_bidder: true },
      });

      const atc_default_bidder = await prisma.auctions_bidders.findFirst({
        where: {
          auction_id: auctions_inventory?.auction_bidder.auction_id,
          bidder: { bidder_number: "5013" },
        },
      });

      if (!atc_default_bidder) {
        throw new DatabaseOperationError("Error voiding item!", {
          cause: "ATC default bidder not found!",
        });
      }

      await prisma.$transaction(
        data.auction_inventories.map(
          ({ auction_inventory_id, inventory_id }) => {
            return prisma.auctions_inventories.update({
              where: { auction_inventory_id },
              data: {
                status: "CANCELLED",
                auction_bidder: {
                  connect: {
                    auction_bidder_id: atc_default_bidder.auction_bidder_id,
                  },
                },
                inventory: { update: { status: "VOID" } },
                histories: {
                  create: {
                    inventory_id,
                    auction_status: "CANCELLED",
                    inventory_status: "VOID",
                    remarks: "ITEM VOIDED",
                  },
                },
              },
            });
          }
        )
      );

      const auction_inventories = await prisma.auctions_inventories.findMany({
        include: {
          inventory: { include: { container: true } },
          auction_bidder: { include: { bidder: true } },
          receipt: true,
          histories: { include: { receipt: true } },
        },
        where: {
          auction_inventory_id: {
            in: data.auction_inventories.map(
              (item) => item.auction_inventory_id
            ),
          },
        },
      });

      return auction_inventories;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error voiding item!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updateAuctionItem: async (data) => {
    try {
      const selected_bidder = await prisma.auctions_bidders.findFirst({
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

      await prisma.$transaction(async (tx) => {
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

        if (auction_inventory.status === "UNPAID") {
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
            const new_bidder_service_charge_amount =
              (data.price * selected_bidder.service_charge) / 100;
            const new_bidder_computed_price =
              new_bidder_service_charge_amount + data.price;

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
            const item_new_price =
              data.price + (data.price * previous_bidder.service_charge) / 100;

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

        const previous_values: Record<string, string | number | null> = {
          barcode: auction_inventory.inventory.barcode,
          control: auction_inventory.inventory.control,
          description: auction_inventory.description,
          price: auction_inventory.price,
          qty: auction_inventory.qty,
          manifest_number: auction_inventory.manifest_number,
          bidder_number: auction_inventory.auction_bidder.bidder.bidder_number,
        };

        const remarks = Object.keys(previous_values).map((item) => {
          const new_data = data[item as keyof typeof data];
          if (previous_values[item] !== new_data) {
            return `${item}: ${previous_values[item]} to ${new_data}`;
          }

          return false;
        });

        await tx.auctions_inventories.update({
          where: { auction_inventory_id: data.auction_inventory_id },
          data: {
            auction_bidder: {
              connect: { auction_bidder_id: selected_bidder.auction_bidder_id },
            },
            price: data.price,
            description: data.description,
            manifest_number: data.manifest_number
              ? data?.manifest_number
              : undefined,
            inventory: {
              update: { barcode: data.barcode, control: data.control },
            },
            histories: {
              create: {
                inventory_id: data.inventory_id,
                auction_status: "DISCREPANCY",
                inventory_status: "SOLD",
                remarks: `Updated ${remarks.filter((item) => item).join(", ")}`,
              },
            },
          },
        });
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
  getInventory: async (inventory_id) => {
    try {
      const inventory = await prisma.inventories.findFirst({
        where: { inventory_id },
        include: {
          histories: true,
          container: true,
          auctions_inventories: {
            include: { receipt: true, auction_bidder: true },
            orderBy: { created_at: "desc" },
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
      const updated = await prisma.inventories.update({
        where: { inventory_id },
        data: {
          barcode: data.barcode,
          control: data.control,
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
    status = ["SOLD", "BOUGHT_ITEM", "UNSOLD", "VOID"]
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
  updateBulkInventoryStatus: async (status, inventory_ids) => {
    try {
      return await prisma.inventories.updateMany({
        where: { inventory_id: { in: inventory_ids } },
        data: { status },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("error updating bulk inventories", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  getBoughtItems: async () => {
    try {
      return await prisma.inventories.findMany({
        where: { status: "BOUGHT_ITEM" },
        include: { auctions_inventories: true },
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
};
