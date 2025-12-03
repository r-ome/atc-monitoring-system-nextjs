import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ContainerSchema } from "src/entities/models/Container";
import { getContainersDueDate } from "src/application/use-cases/statistics/get-containers-due-date.use-case";

function presenter(
  containers: Omit<ContainerSchema, "branch" | "supplier" | "inventories">[]
) {
  const date_format = "MMM d, yyyy";
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
  }));
}

export const GetContainersDueDate = async () => {
  try {
    const containers = await getContainersDueDate();
    return ok(presenter(containers));
  } catch (error) {
    logger("GetBidderBirthdatesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
