import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ContainerWithBranchRow } from "src/entities/models/Container";
import { getContainersDueDateUseCase } from "src/application/use-cases/statistics/get-containers-due-date.use-case";

function presenter(containers: ContainerWithBranchRow[]) {
  const date_format = "MMM d";
  return containers.map((container) => ({
    container_id: container.container_id,
    barcode: container.barcode,
    bill_of_lading_number: container.bill_of_lading_number ?? "",
    container_number: container.container_number ?? "",
    arrival_date: container.arrival_date
      ? formatDate(new Date(container.arrival_date), date_format)
      : "N/A",
    due_date: container.due_date
      ? formatDate(new Date(container.due_date), date_format)
      : "N/A",
    branch: {
      ...container.branch,
      created_at: formatDate(container.branch.created_at, date_format),
      updated_at: formatDate(container.branch.updated_at, date_format),
      deleted_at: container.branch.deleted_at
        ? formatDate(container.branch.deleted_at, date_format)
        : null,
    },
  }));
}

export const GetContainersDueDateController = async () => {
  try {
    const containers = await getContainersDueDateUseCase();
    return ok(presenter(containers));
  } catch (error) {
    logger("GetContainersDueDateController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
