"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { CreateContainerController } from "src/controllers/containers/create-container.controller";
import { GetContainersController } from "src/controllers/containers/get-containers.controller";
import { UpdateContainerController } from "src/controllers/containers/update-container.controller";
import { GetContainerByBarcodeController } from "src/controllers/containers/get-container-by-barcode.controller";
import { UploadInventoryFileController } from "src/controllers/containers/upload-inventory-file.controller";
import { DeleteContainerController } from "src/controllers/containers/delete-container.controller";
import { MergeInventoriesController } from "src/controllers/inventories/merge-inventories.controller";
import { AppendInventoriesController } from "src/controllers/inventories/append-inventories.controller";

export const getContainerByBarcode = async (barcode: string) => {
  return await GetContainerByBarcodeController(barcode);
};

export const getContainers = async () => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetContainersController(),
  );
};

export const createContainer = async (form_data: FormData) => {
  const user = await requireUser();
  const data = Object.fromEntries(form_data.entries());

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await CreateContainerController(data),
  );
};

export const updateContainer = async (containerId: string, input: FormData) => {
  const data = Object.fromEntries(input.entries());
  return await UpdateContainerController(containerId, data);
};

export const uploadInventoryFile = async (
  barcode: string,
  form_data: FormData,
) => {
  const file = form_data.get("file");
  return await UploadInventoryFileController(barcode, file as File);
};

export const deleteContainer = async (container_id: string) => {
  return await DeleteContainerController(container_id);
};

export const mergeInventories = async (input: FormData) => {
  const data = Object.fromEntries(input.entries());
  return await MergeInventoriesController(data);
};

export const appendInventories = async (
  container_barcode: string,
  inventory_ids: string[],
) => {
  return await AppendInventoriesController(container_barcode, inventory_ids);
};
