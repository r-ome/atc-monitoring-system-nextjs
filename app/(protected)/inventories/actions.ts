"use server";

import { GetInventoryController } from "src/controllers/inventories/get-inventory.controller";
import { GetAuctionItemDetailsController } from "src/controllers/inventories/get-auction-item-details.controller";
import { SearchAuctionItemsController } from "src/controllers/inventories/search-auction-items.controller";
import { UpdateAuctionItemController } from "src/controllers/inventories/update-auction-item.controller";
import { UpdateInventoryController } from "src/controllers/inventories/update-inventory.controller";
import { CreateInventoryController } from "src/controllers/inventories/create-inventory.controller";
import { formatNumberPadding } from "@/app/lib/utils";
import { UploadBoughtItemsController } from "src/controllers/inventories/upload-bought-items.controller";
import { GetBoughtItemsController } from "src/controllers/inventories/get-bought-items.controller";
import { GetInventoriesWithNoAuctionsInventoriesController } from "src/controllers/inventories/get-inventories-with-no-auctions-inventories.controller";
import { DeleteInventoryController } from "src/controllers/inventories/delete-inventory.controller";
import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";

export const getAuctionItemDetails = async (auctionInventoryId: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetAuctionItemDetailsController(auctionInventoryId),
  );
};

export const searchAuctionItems = async (query: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    SearchAuctionItemsController(query),
  );
};

export const updateAuctionInventory = async (formData: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  data.control = formatNumberPadding(data.control as string, 4);
  return await runWithUserContext(
    auth.value,
    async () => UpdateAuctionItemController(data),
  );
};

export const getInventory = async (inventory_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetInventoryController(inventory_id),
  );
};

export const updateInventory = async (
  inventory_id: string,
  formData: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  data.control = formatNumberPadding(data.control as string, 4);
  return await runWithUserContext(
    auth.value,
    async () => await UpdateInventoryController(inventory_id, data),
  );
};

export const createInventory = async (formData: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(formData.entries());
  const container_barcode = data.barcode.toString().split("-");

  if (container_barcode.length === 3) {
    data.barcode = `${container_barcode[0]}-${
      container_barcode[1]
    }-${formatNumberPadding(container_barcode[2], 3)}`.replace(",", "-");
  }
  data.control = formatNumberPadding(data.control as string, 4);
  data.description = data.description.toString().toUpperCase();
  return await runWithUserContext(
    auth.value,
    async () => await CreateInventoryController(data),
  );
};

export const uploadBoughtItems = async (
  branch_id: string,
  formData: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const file = formData.get("file");
  return await runWithUserContext(auth.value, async () =>
    UploadBoughtItemsController(branch_id, file as File, auth.value.username),
  );
};

export const getBoughtItems = async (params: {
  year: string;
  month?: string;
  view?: string;
  branchId: string;
}) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetBoughtItemsController(params),
  );
};

export const getInventoriesWithNoAuctionsInventories = async () => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetInventoriesWithNoAuctionsInventoriesController(),
  );
};

export const deleteInventory = async (inventory_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await DeleteInventoryController(inventory_id),
  );
};
