import { NotFoundError } from "src/entities/errors/common";
import { ContainerFileRepository } from "src/infrastructure/di/repositories";
import {
  ContainerReportStorageGateway,
  S3ContainerReportStorage,
} from "src/infrastructure/storage/s3-container-report-storage";

type DeleteContainerReportFileInput = {
  container_file_id: string;
  deleted_by: string;
  storage?: ContainerReportStorageGateway;
};

export const deleteContainerReportFileUseCase = async ({
  container_file_id,
  deleted_by,
  storage = S3ContainerReportStorage,
}: DeleteContainerReportFileInput) => {
  const file =
    await ContainerFileRepository.getContainerFileById(container_file_id);

  if (!file || file.document_type !== "CONTAINER_REPORT") {
    throw new NotFoundError("Container report file not found!");
  }

  await storage.delete({
    bucket: file.s3_bucket,
    key: file.s3_key,
  });

  return await ContainerFileRepository.softDeleteContainerFile(
    container_file_id,
    deleted_by,
  );
};
