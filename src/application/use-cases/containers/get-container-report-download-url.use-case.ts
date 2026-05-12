import { NotFoundError } from "src/entities/errors/common";
import { ContainerFileRepository } from "src/infrastructure/di/repositories";
import {
  ContainerReportStorageGateway,
  S3ContainerReportStorage,
} from "src/infrastructure/storage/s3-container-report-storage";
import { CONTAINER_FILE_DOCUMENT_TYPES } from "src/entities/models/ContainerFile";

type GetContainerReportDownloadUrlInput = {
  container_file_id: string;
  expires_in_seconds?: number;
  storage?: ContainerReportStorageGateway;
};

export const getContainerReportDownloadUrlUseCase = async ({
  container_file_id,
  expires_in_seconds = 300,
  storage = S3ContainerReportStorage,
}: GetContainerReportDownloadUrlInput) => {
  const file =
    await ContainerFileRepository.getContainerFileById(container_file_id);

  if (
    !file ||
    !CONTAINER_FILE_DOCUMENT_TYPES.includes(file.document_type)
  ) {
    throw new NotFoundError("Container file not found!");
  }

  return await storage.getSignedDownloadUrl({
    bucket: file.s3_bucket,
    key: file.s3_key,
    original_filename: file.original_filename,
    expires_in_seconds,
  });
};
