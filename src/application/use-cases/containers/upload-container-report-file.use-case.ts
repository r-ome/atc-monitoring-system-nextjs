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

const MAX_CONTAINER_REPORT_SIZE_BYTES = 25 * 1024 * 1024;
const DOCX_CONTENT_TYPES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/octet-stream",
  "",
];

export type ContainerReportUploadFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

type UploadContainerReportFileInput = {
  container_id: string;
  file: ContainerReportUploadFile | null;
  uploaded_by: string;
  storage?: ContainerReportStorageGateway;
};

const hasDocxExtension = (filename: string) =>
  filename.toLowerCase().endsWith(".docx");

export const uploadContainerReportFileUseCase = async ({
  container_id,
  file,
  uploaded_by,
  storage = S3ContainerReportStorage,
}: UploadContainerReportFileInput) => {
  if (!file) {
    throw new InputParseError("Invalid Data!", {
      cause: { file: ["File is required!"] },
    });
  }

  if (!hasDocxExtension(file.name) || !DOCX_CONTENT_TYPES.includes(file.type)) {
    throw new InputParseError("Invalid Data!", {
      cause: { file: ["Only .docx Word documents are allowed."] },
    });
  }

  if (file.size > MAX_CONTAINER_REPORT_SIZE_BYTES) {
    throw new InputParseError("Invalid Data!", {
      cause: { file: ["File must be 25 MB or smaller."] },
    });
  }

  const container = await ContainerRepository.getContainerById(container_id);
  if (!container) {
    throw new NotFoundError("Container not found!");
  }

  const file_id = randomUUID();
  const bucket = getContainerReportsBucket();
  const version = await ContainerFileRepository.getNextVersion(
    container_id,
    "CONTAINER_REPORT",
  );
  const key = [
    "branches",
    container.branch_id,
    "containers",
    container_id,
    "container-report",
    `v${version}`,
    `${file_id}.docx`,
  ].join("/");
  const buffer = Buffer.from(await file.arrayBuffer());

  await storage.upload({
    bucket,
    key,
    body: buffer,
    content_type: file.type,
  });

  return await ContainerFileRepository.createContainerFile({
    container_file_id: file_id,
    container_id,
    document_type: "CONTAINER_REPORT",
    version,
    original_filename: file.name,
    s3_bucket: bucket,
    s3_key: key,
    content_type: file.type,
    size_bytes: file.size,
    uploaded_by,
  });
};
