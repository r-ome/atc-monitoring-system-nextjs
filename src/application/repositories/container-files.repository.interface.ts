import {
  ContainerFileRow,
  ContainerFileWithContainerRow,
  CreateContainerFileInput,
  CreateGeneratedFinalReportFilesInput,
  ContainerFileDocumentType,
} from "src/entities/models/ContainerFile";

export interface IContainerFileRepository {
  getNextVersion: (
    container_id: string,
    document_type: ContainerFileDocumentType,
  ) => Promise<number>;
  createContainerFile: (
    input: CreateContainerFileInput,
  ) => Promise<ContainerFileRow>;
  getContainerFileById: (
    container_file_id: string,
  ) => Promise<ContainerFileWithContainerRow | null>;
  softDeleteContainerFile: (
    container_file_id: string,
    deleted_by: string,
  ) => Promise<ContainerFileRow>;
  getNextGeneratedFinalReportVersion: (
    container_id: string,
  ) => Promise<number>;
  createGeneratedFinalReportFiles: (
    input: CreateGeneratedFinalReportFilesInput,
  ) => Promise<{
    created: [ContainerFileRow, ContainerFileRow];
    deleted: ContainerFileRow[];
  }>;
}
