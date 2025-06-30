"use server";

import { GetInventoryController } from "src/controllers/inventories/get-inventory.controller";
import { GetAuctionItemDetailsController } from "src/controllers/inventories/get-auction-item-details.controller";
import { UpdateAuctionItemController } from "src/controllers/inventories/update-auction-item.controller";
import { UpdateInventoryController } from "src/controllers/inventories/update-inventory.controller";
import { VoidItemsController } from "src/controllers/inventories/void-items.controller";
import { formatNumberPadding } from "@/app/lib/utils";
import { UploadBoughtItemsController } from "src/controllers/inventories/upload-bought-items.controller";
import { GetBoughtItemsController } from "src/controllers/inventories/get-bought-items.controller";

export const getAuctionItemDetails = async (auctionInventoryId: string) => {
  return await GetAuctionItemDetailsController(auctionInventoryId);
};

export const voidItems = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  data.auction_inventories =
    typeof data.auction_inventories === "string"
      ? JSON.parse(data.auction_inventories as string)
      : [];

  return await VoidItemsController(data);
};

export const updateAuctionInventory = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  data.control = formatNumberPadding(data.control as string, 4);
  return await UpdateAuctionItemController(data);
};

export const getInventory = async (inventory_id: string) => {
  return await GetInventoryController(inventory_id);
};

export const updateInventory = async (
  inventory_id: string,
  formData: FormData
) => {
  const data = Object.fromEntries(formData.entries());
  data.control = formatNumberPadding(data.control as string, 4);
  return await UpdateInventoryController(inventory_id, data);
};

export const uploadBoughtItems = async (formData: FormData) => {
  const file = formData.get("file");
  return await UploadBoughtItemsController(file as File);
};

export const getBoughtItems = async () => {
  return await GetBoughtItemsController();
};
