import { DatabaseOperationError } from "src/entities/errors/common";
import { getContainersUseCase } from "src/application/use-cases/containers/get-containers.use-case";
import { ContainerSchema } from "src/entities/models/Container";
import { BaseInventorySchema } from "src/entities/models/Inventory";
import { format } from "date-fns";
import { ok, err } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

const presenter = (
  containers: (Omit<ContainerSchema, "inventories"> & {
    inventories: BaseInventorySchema[];
  })[]
) => {
  const date_format = "MMM dd, yyyy";
  return containers.map((container) => ({
    container_id: container.container_id,
    barcode: container.barcode,
    supplier_id: container.supplier_id,
    branch_id: container.branch_id,
    bill_of_lading_number: container.bill_of_lading_number ?? "",
    container_number: container.container_number ?? "",
    gross_weight: container.gross_weight ?? "",
    auction_or_sell: container.auction_or_sell ?? "",
    status: container.status ?? "",
    branch: {
      branch_id: container.branch.branch_id,
      name: container.branch.name,
    },
    supplier: {
      supplier_id: container.supplier_id,
      supplier_code: container.supplier.supplier_code,
      name: container.supplier.name,
    },
    arrival_date: container.arrival_date
      ? format(container.arrival_date, date_format)
      : undefined,
    due_date: container.due_date
      ? format(container.due_date, date_format)
      : undefined,
    auction_start_date: container.auction_start_date
      ? format(container.auction_start_date, date_format)
      : undefined,
    auction_end_date: container.auction_end_date
      ? format(container.auction_end_date, date_format)
      : undefined,
    departure_date: container.departure_date
      ? format(container.departure_date, date_format)
      : undefined,
    eta_to_ph: container.eta_to_ph
      ? format(container.eta_to_ph, date_format)
      : undefined,
    created_at: format(container.created_at, date_format),
    updated_at: format(container.updated_at, date_format),
    deleted_at: container.deleted_at
      ? format(container.deleted_at, date_format)
      : null,
    inventories: container.inventories.map((item) => ({
      inventory_id: item.inventory_id,
      container_id: item.container_id,
      container: {
        container_id: item.container_id,
        barcode: container.barcode,
      },
      barcode: item.barcode,
      control: item.control ?? "NC",
      description: item.description,
      status: item.status,
      is_bought_item: item.is_bought_item ?? 0,
      url: item.url,
      created_at: format(item.created_at, date_format),
      updated_at: format(item.updated_at, date_format),
      deleted_at: item.deleted_at ? format(item.deleted_at, date_format) : null,
    })),
  }));
};

export const GetContainersController = async () => {
  try {
    const containers = await getContainersUseCase();
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
