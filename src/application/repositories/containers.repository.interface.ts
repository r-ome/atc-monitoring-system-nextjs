import {
  ContainerRow,
  ContainerBarcodeRow,
  ContainerFinalReportRow,
  ContainerListRow,
  ContainerWithAllRow,
  ContainerWithDetailsRow,
  ContainerWithInventoriesRow,
  ContainerWithSupplierAndBranchRow,
  CreateContainerInput,
  UpdateContainerInput,
} from "src/entities/models/Container";
import {
  UploadInventoryFileWriteInput,
  UploadInventoryFileWriteResult,
} from "src/entities/models/Inventory";
import { ContainerTaxDeductionRecord } from "src/entities/models/FinalReport";
import { FinalReportDraft } from "src/entities/models/FinalReportDraft";

export interface IContainerRepository {
  getContainerByBarcode: (
    barcode: string,
  ) => Promise<ContainerWithDetailsRow | null>;
  getContainerFinalReportData: (
    barcode: string,
  ) => Promise<ContainerFinalReportRow | null>;
  getContainerById: (
    container_id: string,
  ) => Promise<ContainerWithDetailsRow | null>;
  getContainers: () => Promise<ContainerWithAllRow[]>;
  getContainerBarcodes: () => Promise<ContainerBarcodeRow[]>;
  getContainersList: () => Promise<ContainerListRow[]>;
  createContainer: (container: CreateContainerInput) => Promise<ContainerRow>;
  getInventoriesByContainerBarcode: (barcode: string) => Promise<ContainerWithInventoriesRow>;
  updateContainer: (
    container_id: string,
    data: UpdateContainerInput,
  ) => Promise<ContainerWithSupplierAndBranchRow>;
  uploadInventoryFile: (
    input: UploadInventoryFileWriteInput,
  ) => Promise<UploadInventoryFileWriteResult>;
  updateContainerStatus: (
    container_id: string,
    paid_at: string | null,
  ) => Promise<ContainerRow>;
  deleteContainer: (container_id: string) => Promise<ContainerRow>;
  getContainerTaxDeduction: (
    container_id: string,
  ) => Promise<ContainerTaxDeductionRecord | null>;
  setContainerTaxDeduction: (
    container_id: string,
    record: ContainerTaxDeductionRecord,
  ) => Promise<void>;
  clearContainerTaxDeduction: (container_id: string) => Promise<void>;
  getFinalReportDraft: (container_id: string) => Promise<FinalReportDraft | null>;
  setFinalReportDraft: (
    container_id: string,
    draft: FinalReportDraft,
  ) => Promise<void>;
  clearFinalReportDraft: (container_id: string) => Promise<void>;
}
