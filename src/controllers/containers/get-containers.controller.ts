import { DatabaseOperationError } from "src/entities/errors/common";
import { ContainerRepository } from "src/infrastructure/di/repositories";
import { ContainerListRow } from "src/entities/models/Container";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

const DATE_FORMAT = "MMM dd, yyyy";

const presenter = (containers: ContainerListRow[]) => {
  return containers.map((container) => ({
    container_id: container.container_id,
    barcode: container.barcode,
    supplier_id: container.supplier_id,
    branch_id: container.branch_id,
    bill_of_lading_number: container.bill_of_lading_number ?? "",
    container_number: container.container_number ?? "",
    gross_weight: container.gross_weight ?? "",
    auction_or_sell: container.auction_or_sell,
    status: container.status,
    duties_and_taxes: Number(container.duties_and_taxes),
    branch: {
      branch_id: container.branch.branch_id,
      name: container.branch.name,
    },
    supplier: {
      supplier_id: container.supplier.supplier_id,
      supplier_code: container.supplier.supplier_code,
      name: container.supplier.name,
    },
    arrival_date: container.arrival_date
      ? formatDate(container.arrival_date, DATE_FORMAT)
      : undefined,
    due_date: container.due_date
      ? formatDate(container.due_date, DATE_FORMAT)
      : undefined,
    created_at: formatDate(container.created_at, DATE_FORMAT),
    updated_at: formatDate(container.updated_at, DATE_FORMAT),
    deleted_at: container.deleted_at
      ? formatDate(container.deleted_at, DATE_FORMAT)
      : null,
    inventory_count: container._count.inventories,
  }));
};

export const GetContainersController = async () => {
  try {
    const containers = await ContainerRepository.getContainersList();
    return ok(presenter(containers));
  } catch (error) {
    logger("GetContainersController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Unhandled Error.",
    });
  }
};
