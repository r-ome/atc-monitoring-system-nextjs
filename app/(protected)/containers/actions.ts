"use server";

import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { CreateContainerController } from "src/controllers/containers/create-container.controller";
import { GetContainersController } from "src/controllers/containers/get-containers.controller";
import { UpdateContainerController } from "src/controllers/containers/update-container.controller";
import { UpdateContainerStatusController } from "src/controllers/containers/update-container-status.controller";
import { GetContainerByBarcodeController } from "src/controllers/containers/get-container-by-barcode.controller";
import { UploadInventoryFileController } from "src/controllers/containers/upload-inventory-file.controller";
import { DeleteContainerController } from "src/controllers/containers/delete-container.controller";
import { MergeInventoriesController } from "src/controllers/inventories/merge-inventories.controller";
import { AppendInventoriesController } from "src/controllers/inventories/append-inventories.controller";
import { LogContainerReportController } from "src/controllers/containers/log-container-report.controller";

export const getContainerByBarcode = async (barcode: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    GetContainerByBarcodeController(barcode),
  );
};

export const getContainers = async () => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetContainersController(),
  );
};

export const createContainer = async (form_data: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(form_data.entries());

  return await runWithUserContext(
    auth.value,
    async () => await CreateContainerController(data),
  );
};

export const updateContainer = async (containerId: string, input: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(input.entries());
  return await runWithUserContext(
    auth.value,
    async () => await UpdateContainerController(containerId, data),
  );
};

export const uploadInventoryFile = async (
  barcode: string,
  form_data: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const file = form_data.get("file");
  return await runWithUserContext(
    auth.value,
    async () => await UploadInventoryFileController(barcode, file as File),
  );
};

export const updateContainerStatus = async (
  container_id: string,
  paid_at: string | null,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await UpdateContainerStatusController(container_id, paid_at),
  );
};

export const deleteContainer = async (container_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await DeleteContainerController(container_id),
  );
};

export const mergeInventories = async (input: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const data = Object.fromEntries(input.entries());
  return await runWithUserContext(
    auth.value,
    async () => await MergeInventoriesController(data),
  );
};

export const appendInventories = async (
  container_barcode: string,
  inventory_ids: string[],
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () =>
      await AppendInventoriesController(container_barcode, inventory_ids),
  );
};

export const logContainerReport = async (input: Record<string, unknown>) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await LogContainerReportController(input),
  );
};
