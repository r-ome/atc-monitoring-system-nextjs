import { Prisma, container_document_type } from "@prisma/client";

export const CONTAINER_FILE_DOCUMENT_TYPES = [
  "CONTAINER_REPORT",
  "FINAL_REPORT_ORIGINAL",
  "FINAL_REPORT_MODIFIED",
] as const;

export type ContainerFileDocumentType =
  (typeof CONTAINER_FILE_DOCUMENT_TYPES)[number];

export const FINAL_REPORT_DOCUMENT_TYPES = [
  "FINAL_REPORT_ORIGINAL",
  "FINAL_REPORT_MODIFIED",
] as const;

export type FinalReportDocumentType =
  (typeof FINAL_REPORT_DOCUMENT_TYPES)[number];

export type ContainerFileRow = Prisma.container_filesGetPayload<object>;

export type ContainerFileWithContainerRow = Prisma.container_filesGetPayload<{
  include: { container: true };
}>;

export type CreateContainerFileInput = {
  container_file_id: string;
  container_id: string;
  document_type: container_document_type;
  version: number;
  original_filename: string;
  s3_bucket: string;
  s3_key: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: string;
};

export type CreateGeneratedFinalReportFilesInput = {
  files: [CreateContainerFileInput, CreateContainerFileInput];
  deleted_by: string;
};

export type ContainerReportFile = {
  container_file_id: string;
  document_type: ContainerFileDocumentType;
  version: number;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
  current: boolean;
};

export type FinalReportFile = {
  container_file_id: string;
  document_type: FinalReportDocumentType;
  variant: "original" | "modified";
  version: number;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  uploaded_by: string;
  uploaded_at: string;
};

export type FinalReportFilePair = {
  version: number;
  original: FinalReportFile | null;
  modified: FinalReportFile | null;
};
