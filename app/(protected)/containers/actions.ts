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
import { UploadContainerReportFileController } from "src/controllers/containers/upload-container-report-file.controller";
import { GetContainerReportDownloadUrlController } from "src/controllers/containers/get-container-report-download-url.controller";
import { DeleteContainerReportFileController } from "src/controllers/containers/delete-container-report-file.controller";
import { DeleteContainerController } from "src/controllers/containers/delete-container.controller";
import { MergeInventoriesController } from "src/controllers/inventories/merge-inventories.controller";
import { AppendInventoriesController } from "src/controllers/inventories/append-inventories.controller";
import { LogContainerReportController } from "src/controllers/containers/log-container-report.controller";
import { GetFinalReportPreviewController } from "src/controllers/containers/get-final-report-preview.controller";
import { ApplyFinalReportMatchesController } from "src/controllers/containers/apply-final-report-matches.controller";
import { CreateFinalReportBoughtItemsController } from "src/controllers/containers/create-final-report-bought-items.controller";
import { ApplyContainerTaxDeductionController } from "src/controllers/containers/apply-container-tax-deduction.controller";
import { ClearContainerTaxDeductionController } from "src/controllers/containers/clear-container-tax-deduction.controller";
import { ApplyFinalReportCounterCheckMatchesController } from "src/controllers/containers/apply-final-report-counter-check-matches.controller";
import { CreateFinalReportAddOnsController } from "src/controllers/containers/create-final-report-add-ons.controller";
import { ApplyFinalReportQtySplitController } from "src/controllers/containers/apply-final-report-qty-split.controller";
import { ApplyFinalReportVoidController } from "src/controllers/containers/apply-final-report-void.controller";
import { ApplyFinalReportDirectBoughtController } from "src/controllers/containers/apply-final-report-direct-bought.controller";
import { SaveFinalReportDraftController } from "src/controllers/containers/save-final-report-draft.controller";
import { GetFinalReportDraftController } from "src/controllers/containers/get-final-report-draft.controller";
import { ClearFinalReportDraftController } from "src/controllers/containers/clear-final-report-draft.controller";
import { FinalizeFinalReportController } from "src/controllers/containers/finalize-final-report.controller";
import type { FinalReportDraft } from "src/entities/models/FinalReportDraft";

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

export const uploadContainerReportFile = async (
  container_id: string,
  form_data: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  const file = form_data.get("file");
  const uploadFile =
    file && typeof file === "object" && "arrayBuffer" in file
      ? (file as File)
      : null;

  return await runWithUserContext(
    auth.value,
    async () =>
      await UploadContainerReportFileController(
        container_id,
        uploadFile,
      ),
  );
};

export const getContainerReportDownloadUrl = async (
  container_file_id: string,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await GetContainerReportDownloadUrlController(container_file_id),
  );
};

export const deleteContainerReportFile = async (
  container_file_id: string,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await DeleteContainerReportFileController(container_file_id),
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

export const mergeFinalReportInventories = async (input: {
  old_inventory_id: string;
  new_inventory_id: string;
  control_choice?: "UNSOLD" | "SOLD";
}) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await MergeInventoriesController(input),
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

export const getFinalReportPreview = async (input: Record<string, unknown>) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetFinalReportPreviewController(input),
  );
};

export const applyFinalReportMatches = async (
  input: Record<string, unknown>,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await ApplyFinalReportMatchesController(input),
  );
};

export const createFinalReportBoughtItems = async (
  input: Record<string, unknown>,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await CreateFinalReportBoughtItemsController(input),
  );
};

export const applyContainerTaxDeduction = async (
  input: Record<string, unknown>,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await ApplyContainerTaxDeductionController(input),
  );
};

export const clearContainerTaxDeduction = async (
  input: Record<string, unknown>,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await ClearContainerTaxDeductionController(input),
  );
};

export const applyFinalReportCounterCheckMatches = async (
  input: Record<string, unknown>,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await ApplyFinalReportCounterCheckMatchesController(input),
  );
};

export const createFinalReportAddOns = async (
  input: Record<string, unknown>,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await CreateFinalReportAddOnsController(input),
  );
};

export const applyFinalReportQtySplit = async (input: {
  source_auction_inventory_id: string;
  splits: Array<{ target_inventory_id: string; price: number; qty: string }>;
}) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await ApplyFinalReportQtySplitController(input),
  );
};

export const applyFinalReportVoid = async (input: {
  inventory_id: string;
}) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await ApplyFinalReportVoidController(input),
  );
};

export const applyFinalReportDirectBoughtItem = async (input: {
  inventory_id: string;
  auction_id: string;
  price: number;
  qty: string;
}) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await ApplyFinalReportDirectBoughtController(input),
  );
};

export const saveFinalReportDraft = async (input: {
  container_id: string;
  draft: FinalReportDraft;
}) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await SaveFinalReportDraftController(input),
  );
};

export const getFinalReportDraft = async (container_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetFinalReportDraftController(container_id),
  );
};

export const clearFinalReportDraft = async (container_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await ClearFinalReportDraftController(container_id),
  );
};

export const finalizeFinalReport = async (container_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await FinalizeFinalReportController(container_id),
  );
};
