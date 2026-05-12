import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { uploadContainerReportFileUseCase } from "./upload-container-report-file.use-case";
import { uploadGeneratedFinalReportFilesUseCase } from "./upload-generated-final-report-files.use-case";
import { deleteContainerReportFileUseCase } from "./delete-container-report-file.use-case";
import {
  ContainerFileRepository,
  ContainerRepository,
} from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";
import type { ContainerReportStorageGateway } from "src/infrastructure/storage/s3-container-report-storage";
import { InputParseError, NotFoundError } from "src/entities/errors/common";

const restorers: Array<() => void> = [];
const originalBucket = process.env.AWS_S3_CONTAINER_REPORTS_BUCKET;

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }

  process.env.AWS_S3_CONTAINER_REPORTS_BUCKET = originalBucket;
});

const createDocxFile = (name = "report.docx") => ({
  name,
  type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  size: 4,
  arrayBuffer: async () => Buffer.from("docx").buffer,
});

const createXlsxFile = (name = "report.xlsx", size = 4) => ({
  name,
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  size,
  arrayBuffer: async () => Buffer.from("xlsx").buffer,
});

test("uploadContainerReportFileUseCase rejects missing and non-docx files", async () => {
  await assert.rejects(
    () =>
      uploadContainerReportFileUseCase({
        container_id: "container-1",
        file: null,
        uploaded_by: "jerome",
      }),
    InputParseError,
  );

  await assert.rejects(
    () =>
      uploadContainerReportFileUseCase({
        container_id: "container-1",
        file: createDocxFile("report.pdf"),
        uploaded_by: "jerome",
      }),
    InputParseError,
  );
});

test("uploadContainerReportFileUseCase creates increasing versions and never reuses deleted versions", async () => {
  process.env.AWS_S3_CONTAINER_REPORTS_BUCKET = "container-reports";
  const createdVersions: number[] = [];
  const uploadedKeys: string[] = [];
  let latestVersion = 0;

  const storage: ContainerReportStorageGateway = {
    upload: async ({ key }) => {
      uploadedKeys.push(key);
    },
    getSignedDownloadUrl: async () => "https://example.test/report",
    delete: async () => undefined,
  };

  restorers.push(
    patchMethod(ContainerRepository, "getContainerById", async () =>
      ({
        container_id: "container-1",
        branch_id: "branch-1",
      }) as never,
    ),
    patchMethod(ContainerFileRepository, "getNextVersion", async () => {
      latestVersion += 1;
      return latestVersion;
    }),
    patchMethod(ContainerFileRepository, "createContainerFile", async (input) => {
      createdVersions.push(input.version);
      return input as never;
    }),
  );

  await uploadContainerReportFileUseCase({
    container_id: "container-1",
    file: createDocxFile(),
    uploaded_by: "jerome",
    storage,
  });
  latestVersion = 1;
  await uploadContainerReportFileUseCase({
    container_id: "container-1",
    file: createDocxFile(),
    uploaded_by: "jerome",
    storage,
  });
  latestVersion = 4;
  await uploadContainerReportFileUseCase({
    container_id: "container-1",
    file: createDocxFile(),
    uploaded_by: "jerome",
    storage,
  });

  assert.deepEqual(createdVersions, [1, 2, 5]);
  assert.equal(uploadedKeys[0].includes("/v1/"), true);
  assert.equal(uploadedKeys[1].includes("/v2/"), true);
  assert.equal(uploadedKeys[2].includes("/v5/"), true);
});

test("deleteContainerReportFileUseCase validates ownership, deletes S3 object, and soft-deletes metadata", async () => {
  const deletedObjects: Array<{ bucket: string; key: string }> = [];
  const softDeleted: Array<{ id: string; by: string }> = [];

  const storage: ContainerReportStorageGateway = {
    upload: async () => undefined,
    getSignedDownloadUrl: async () => "https://example.test/report",
    delete: async (input) => {
      deletedObjects.push(input);
    },
  };

  restorers.push(
    patchMethod(ContainerFileRepository, "getContainerFileById", async (id) => {
      if (id === "missing-file") return null;
      return {
        container_file_id: id,
        document_type: "CONTAINER_REPORT",
        s3_bucket: "container-reports",
        s3_key: "branches/branch-1/containers/container-1/report.docx",
      } as never;
    }),
    patchMethod(
      ContainerFileRepository,
      "softDeleteContainerFile",
      async (id, by) => {
        softDeleted.push({ id, by });
        return { container_file_id: id, version: 2 } as never;
      },
    ),
  );

  await assert.rejects(
    () =>
      deleteContainerReportFileUseCase({
        container_file_id: "missing-file",
        deleted_by: "jerome",
        storage,
      }),
    NotFoundError,
  );

  await deleteContainerReportFileUseCase({
    container_file_id: "file-1",
    deleted_by: "jerome",
    storage,
  });

  assert.deepEqual(deletedObjects, [
    {
      bucket: "container-reports",
      key: "branches/branch-1/containers/container-1/report.docx",
    },
  ]);
  assert.deepEqual(softDeleted, [{ id: "file-1", by: "jerome" }]);
});

test("uploadGeneratedFinalReportFilesUseCase rejects missing, non-xlsx, and oversized files", async () => {
  await assert.rejects(
    () =>
      uploadGeneratedFinalReportFilesUseCase({
        container_id: "container-1",
        original_file: null,
        modified_file: createXlsxFile("modified.xlsx"),
        uploaded_by: "jerome",
      }),
    InputParseError,
  );

  await assert.rejects(
    () =>
      uploadGeneratedFinalReportFilesUseCase({
        container_id: "container-1",
        original_file: createXlsxFile("original.pdf"),
        modified_file: createXlsxFile("modified.xlsx"),
        uploaded_by: "jerome",
      }),
    InputParseError,
  );

  await assert.rejects(
    () =>
      uploadGeneratedFinalReportFilesUseCase({
        container_id: "container-1",
        original_file: createXlsxFile("original.xlsx", 25 * 1024 * 1024 + 1),
        modified_file: createXlsxFile("modified.xlsx"),
        uploaded_by: "jerome",
      }),
    InputParseError,
  );
});

test("uploadGeneratedFinalReportFilesUseCase creates versioned original/modified pair and hides old generated reports", async () => {
  process.env.AWS_S3_CONTAINER_REPORTS_BUCKET = "container-reports";
  const uploadedKeys: string[] = [];
  const deletedKeys: string[] = [];
  const createdDocumentTypes: string[] = [];
  const createdVersions: number[] = [];

  const storage: ContainerReportStorageGateway = {
    upload: async ({ key }) => {
      uploadedKeys.push(key);
    },
    getSignedDownloadUrl: async () => "https://example.test/report",
    delete: async ({ key }) => {
      deletedKeys.push(key);
    },
  };

  restorers.push(
    patchMethod(ContainerRepository, "getContainerById", async () =>
      ({
        container_id: "container-1",
        branch_id: "branch-1",
      }) as never,
    ),
    patchMethod(
      ContainerFileRepository,
      "getNextGeneratedFinalReportVersion",
      async () => 5,
    ),
    patchMethod(
      ContainerFileRepository,
      "createGeneratedFinalReportFiles",
      async ({ files }) => {
        createdDocumentTypes.push(...files.map((file) => file.document_type));
        createdVersions.push(...files.map((file) => file.version));
        return {
          created: files as never,
          deleted: [
            {
              container_file_id: "old-original",
              s3_bucket: "container-reports",
              s3_key:
                "branches/branch-1/containers/container-1/final-report/v4/original/old.xlsx",
            },
            {
              container_file_id: "old-modified",
              s3_bucket: "container-reports",
              s3_key:
                "branches/branch-1/containers/container-1/final-report/v4/modified/old.xlsx",
            },
          ] as never,
        };
      },
    ),
  );

  const result = await uploadGeneratedFinalReportFilesUseCase({
    container_id: "container-1",
    original_file: createXlsxFile("original.xlsx"),
    modified_file: createXlsxFile("modified.xlsx"),
    uploaded_by: "jerome",
    storage,
  });

  assert.equal(result.version, 5);
  assert.deepEqual(createdDocumentTypes, [
    "FINAL_REPORT_ORIGINAL",
    "FINAL_REPORT_MODIFIED",
  ]);
  assert.deepEqual(createdVersions, [5, 5]);
  assert.equal(
    uploadedKeys[0].includes(
      "/containers/container-1/final-report/v5/original/",
    ),
    true,
  );
  assert.equal(
    uploadedKeys[1].includes(
      "/containers/container-1/final-report/v5/modified/",
    ),
    true,
  );
  assert.deepEqual(deletedKeys, [
    "branches/branch-1/containers/container-1/final-report/v4/original/old.xlsx",
    "branches/branch-1/containers/container-1/final-report/v4/modified/old.xlsx",
  ]);
});
