"use server";

import { CreateContainerController } from "src/controllers/containers/create-container.controller";
import { GetContainersController } from "src/controllers/containers/get-containers.controller";
import { UpdateContainerController } from "src/controllers/containers/update-container.controller";
import { GetContainerByBarcodeController } from "src/controllers/containers/get-container-by-barcode.controller";
import { UploadInventoryFileController } from "src/controllers/containers/upload-inventory-file.controller";
import { DeleteContainerController } from "src/controllers/containers/delete-container.controller";

export const getContainerByBarcode = async (barcode: string) => {
  return await GetContainerByBarcodeController(barcode);
};

export const getContainers = async () => {
  return await GetContainersController();
};

export const createContainer = async (form_data: FormData) => {
  const data = Object.fromEntries(form_data.entries());
  return await CreateContainerController(data);
};

export const updateContainer = async (containerId: string, input: FormData) => {
  const data = Object.fromEntries(input.entries());
  return await UpdateContainerController(containerId, data);
};

export const uploadInventoryFile = async (
  barcode: string,
  form_data: FormData
) => {
  const file = form_data.get("file");
  return await UploadInventoryFileController(barcode, file as File);
};

export const deleteContainer = async (container_id: string) => {
  return await DeleteContainerController(container_id);
};
