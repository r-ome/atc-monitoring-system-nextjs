import { randomUUID } from "node:crypto";
import { InputParseError, NotFoundError } from "src/entities/errors/common";
import {
  ContainerFileRepository,
  ContainerRepository,
} from "src/infrastructure/di/repositories";
import {
  ContainerReportStorageGateway,
  getContainerReportsBucket,
  S3ContainerReportStorage,
} from "src/infrastructure/storage/s3-container-report-storage";

const MAX_FINAL_REPORT_SIZE_BYTES = 25 * 1024 * 1024;
const XLSX_CONTENT_TYPE =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const XLSX_CONTENT_TYPES = [XLSX_CONTENT_TYPE, "application/octet-stream", ""];

export type GeneratedFinalReportUploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

type UploadGeneratedFinalReportFilesInput = {
  container_id: string;
  original_file: GeneratedFinalReportUploadFile | null;
  modified_file: GeneratedFinalReportUploadFile | null;
  uploaded_by: string;
  storage?: ContainerReportStorageGateway;
};

const hasXlsxExtension = (filename: string) =>
  filename.toLowerCase().endsWith(".xlsx");

const validateFile = (
  file: GeneratedFinalReportUploadFile | null,
) => {
  if (!file) {
    return ["File is required!"];
  }

  if (!hasXlsxExtension(file.name) || !XLSX_CONTENT_TYPES.includes(file.type)) {
    return ["Only .xlsx Excel workbooks are allowed."];
  }

  if (file.size > MAX_FINAL_REPORT_SIZE_BYTES) {
    return ["File must be 25 MB or smaller."];
  }

  return [];
};

export const uploadGeneratedFinalReportFilesUseCase = async ({
  container_id,
  original_file,
  modified_file,
  uploaded_by,
  storage = S3ContainerReportStorage,
}: UploadGeneratedFinalReportFilesInput) => {
  const errors = {
    original_file: validateFile(original_file),
    modified_file: validateFile(modified_file),
  };

  if (errors.original_file.length || errors.modified_file.length) {
    throw new InputParseError("Invalid Data!", {
      cause: Object.fromEntries(
        Object.entries(errors).filter(([, value]) => value.length),
      ),
    });
  }

  if (!original_file || !modified_file) {
    throw new InputParseError("Invalid Data!", {
      cause: { file: ["Original and modified files are required."] },
    });
  }

  const container = await ContainerRepository.getContainerById(container_id);
  if (!container) {
    throw new NotFoundError("Container not found!");
  }

  const bucket = getContainerReportsBucket();
  const version =
    await ContainerFileRepository.getNextGeneratedFinalReportVersion(
      container_id,
    );
  const original_file_id = randomUUID();
  const modified_file_id = randomUUID();
  const original_key = [
    "branches",
    container.branch_id,
    "containers",
    container_id,
    "final-report",
    `v${version}`,
    "original",
    `${original_file_id}.xlsx`,
  ].join("/");
  const modified_key = [
    "branches",
    container.branch_id,
    "containers",
    container_id,
    "final-report",
    `v${version}`,
    "modified",
    `${modified_file_id}.xlsx`,
  ].join("/");
  const uploadedObjects: Array<{ bucket: string; key: string }> = [];

  try {
    await storage.upload({
      bucket,
      key: original_key,
      body: Buffer.from(await original_file.arrayBuffer()),
      content_type: original_file.type || XLSX_CONTENT_TYPE,
    });
    uploadedObjects.push({ bucket, key: original_key });

    await storage.upload({
      bucket,
      key: modified_key,
      body: Buffer.from(await modified_file.arrayBuffer()),
      content_type: modified_file.type || XLSX_CONTENT_TYPE,
    });
    uploadedObjects.push({ bucket, key: modified_key });

    const result = await ContainerFileRepository.createGeneratedFinalReportFiles({
      deleted_by: uploaded_by,
      files: [
        {
          container_file_id: original_file_id,
          container_id,
          document_type: "FINAL_REPORT_ORIGINAL",
          version,
          original_filename: original_file.name,
          s3_bucket: bucket,
          s3_key: original_key,
          content_type: original_file.type || XLSX_CONTENT_TYPE,
          size_bytes: original_file.size,
          uploaded_by,
        },
        {
          container_file_id: modified_file_id,
          container_id,
          document_type: "FINAL_REPORT_MODIFIED",
          version,
          original_filename: modified_file.name,
          s3_bucket: bucket,
          s3_key: modified_key,
          content_type: modified_file.type || XLSX_CONTENT_TYPE,
          size_bytes: modified_file.size,
          uploaded_by,
        },
      ],
    });

    await Promise.allSettled(
      result.deleted.map((file) =>
        storage.delete({
          bucket: file.s3_bucket,
          key: file.s3_key,
        }),
      ),
    );

    return {
      version,
      files: result.created,
      hidden_files: result.deleted,
    };
  } catch (error) {
    await Promise.allSettled(
      uploadedObjects.map((object) => storage.delete(object)),
    );
    throw error;
  }
};
