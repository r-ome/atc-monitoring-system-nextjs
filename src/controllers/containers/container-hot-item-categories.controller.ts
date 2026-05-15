import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  createContainerHotItemCategorySchema,
  deleteContainerHotItemCategorySchema,
  getContainerHotItemsSchema,
  updateContainerHotItemCategorySchema,
} from "src/entities/models/ContainerHotItemCategory";
import { err, ok } from "src/entities/models/Result";
import { ContainerHotItemCategoryRepository } from "src/infrastructure/di/repositories";

function parseInput<T>(
  result: { success: true; data: T } | { success: false; error: { flatten: () => { fieldErrors: Record<string, string[]> } } },
): T {
  if (!result.success) {
    throw new InputParseError("Invalid Data!", {
      cause: result.error.flatten().fieldErrors,
    });
  }

  return result.data;
}

function handleControllerError(context: string, error: unknown) {
  if (error instanceof InputParseError || error instanceof NotFoundError) {
    logger(context, error, "warn");
    return err({ message: error.message, cause: error.cause });
  }

  logger(context, error);
  if (error instanceof DatabaseOperationError) {
    return err({ message: "Server Error", cause: error.message });
  }

  return err({
    message: "An error occurred! Please contact your admin!",
    cause: "Server Error",
  });
}

export const GetContainerHotItemCategoriesController = async (
  input: Record<string, unknown>,
) => {
  try {
    const data = parseInput(getContainerHotItemsSchema.safeParse(input));
    const report =
      await ContainerHotItemCategoryRepository.getReportByContainerId(
        data.container_id,
      );

    return ok(report);
  } catch (error) {
    return handleControllerError(
      "GetContainerHotItemCategoriesController",
      error,
    );
  }
};

export const CreateContainerHotItemCategoryController = async (
  input: Record<string, unknown>,
) => {
  try {
    const data = parseInput(
      createContainerHotItemCategorySchema.safeParse(input),
    );
    const category =
      await ContainerHotItemCategoryRepository.createCategory(data);

    await logActivity(
      "CREATE",
      "container",
      data.container_id,
      `Created hot item category ${category.name}`,
    );

    return ok(category);
  } catch (error) {
    return handleControllerError(
      "CreateContainerHotItemCategoryController",
      error,
    );
  }
};

export const UpdateContainerHotItemCategoryController = async (
  input: Record<string, unknown>,
) => {
  try {
    const data = parseInput(
      updateContainerHotItemCategorySchema.safeParse(input),
    );
    const category =
      await ContainerHotItemCategoryRepository.updateCategory(data);

    await logActivity(
      "UPDATE",
      "container",
      category.container_id,
      `Updated hot item category ${category.name}`,
    );

    return ok(category);
  } catch (error) {
    return handleControllerError(
      "UpdateContainerHotItemCategoryController",
      error,
    );
  }
};

export const DeleteContainerHotItemCategoryController = async (
  input: Record<string, unknown>,
) => {
  try {
    const data = parseInput(
      deleteContainerHotItemCategorySchema.safeParse(input),
    );
    const category =
      await ContainerHotItemCategoryRepository.deleteCategory(data.category_id);

    await logActivity(
      "DELETE",
      "container",
      category.container_id,
      `Deleted hot item category ${category.name}`,
    );

    return ok(category);
  } catch (error) {
    return handleControllerError(
      "DeleteContainerHotItemCategoryController",
      error,
    );
  }
};
