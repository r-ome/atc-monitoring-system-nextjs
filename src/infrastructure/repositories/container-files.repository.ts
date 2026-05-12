import prisma from "@/app/lib/prisma/prisma";
import { buildTenantWhere } from "@/app/lib/prisma/tenant-where";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IContainerFileRepository } from "src/application/repositories/container-files.repository.interface";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { FINAL_REPORT_DOCUMENT_TYPES } from "src/entities/models/ContainerFile";

export const ContainerFileRepository: IContainerFileRepository = {
  getNextVersion: async (container_id, document_type) => {
    try {
      const container = await prisma.containers.findFirst({
        where: buildTenantWhere("containers", { container_id }),
        select: { container_id: true },
      });

      if (!container) {
        throw new NotFoundError("Container not found!");
      }

      const latest = await prisma.container_files.findFirst({
        where: buildTenantWhere("container_files", {
          container_id,
          document_type,
        }),
        select: { version: true },
        orderBy: { version: "desc" },
      });

      return (latest?.version ?? 0) + 1;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting container file version!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  createContainerFile: async (input) => {
    try {
      const container = await prisma.containers.findFirst({
        where: buildTenantWhere("containers", {
          container_id: input.container_id,
        }),
        select: { container_id: true },
      });

      if (!container) {
        throw new NotFoundError("Container not found!");
      }

      return await prisma.container_files.create({
        data: input,
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating container file!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getContainerFileById: async (container_file_id) => {
    try {
      return await prisma.container_files.findFirst({
        where: buildTenantWhere("container_files", {
          container_file_id,
          deleted_at: null,
        }),
        include: { container: true },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting container file!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  softDeleteContainerFile: async (container_file_id, deleted_by) => {
    try {
      const current = await prisma.container_files.findFirst({
        where: buildTenantWhere("container_files", {
          container_file_id,
          deleted_at: null,
        }),
        select: { container_file_id: true },
      });

      if (!current) {
        throw new NotFoundError("Container file not found!");
      }

      return await prisma.container_files.update({
        where: { container_file_id },
        data: {
          deleted_by,
          deleted_at: new Date(),
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting container file!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getNextGeneratedFinalReportVersion: async (container_id) => {
    try {
      const container = await prisma.containers.findFirst({
        where: buildTenantWhere("containers", { container_id }),
        select: { container_id: true },
      });

      if (!container) {
        throw new NotFoundError("Container not found!");
      }

      const latest = await prisma.container_files.findFirst({
        where: buildTenantWhere("container_files", {
          container_id,
          document_type: { in: [...FINAL_REPORT_DOCUMENT_TYPES] },
        }),
        select: { version: true },
        orderBy: { version: "desc" },
      });

      return (latest?.version ?? 0) + 1;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error getting generated final report version!",
          {
            cause: error.message,
          },
        );
      }

      throw error;
    }
  },
  createGeneratedFinalReportFiles: async ({ files, deleted_by }) => {
    try {
      const [original, modified] = files;
      const container = await prisma.containers.findFirst({
        where: buildTenantWhere("containers", {
          container_id: original.container_id,
        }),
        select: { container_id: true },
      });

      if (!container || original.container_id !== modified.container_id) {
        throw new NotFoundError("Container not found!");
      }

      return await prisma.$transaction(async (tx) => {
        const previous = await tx.container_files.findMany({
          where: buildTenantWhere("container_files", {
            container_id: original.container_id,
            document_type: { in: [...FINAL_REPORT_DOCUMENT_TYPES] },
            deleted_at: null,
          }),
        });

        const createdOriginal = await tx.container_files.create({
          data: original,
        });
        const createdModified = await tx.container_files.create({
          data: modified,
        });

        const deleted = await Promise.all(
          previous.map((file) =>
            tx.container_files.update({
              where: { container_file_id: file.container_file_id },
              data: {
                deleted_by,
                deleted_at: new Date(),
              },
            }),
          ),
        );

        return {
          created: [createdOriginal, createdModified],
          deleted,
        };
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError(
          "Error creating generated final report files!",
          {
            cause: error.message,
          },
        );
      }

      throw error;
    }
  },
};
