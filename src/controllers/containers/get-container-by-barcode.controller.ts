import { getContainerByBarcodeUseCase } from "src/application/use-cases/containers/get-container-by-barcode.use-case";
import { ContainerSchema } from "src/entities/models/Container";
import { DatabaseOperationError } from "src/entities/errors/common";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Response";
import { logger } from "@/app/lib/logger";

const presenter = (container: ContainerSchema) => {
  const date_format = "MMM dd, yyyy";

  const timestamps = container.inventories
    .map((i) => i.auction_date)
    .flatMap((d) => {
      if (!d) return [];

      const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
      return isNaN(t) ? [] : [t];
    });

  const auction_start_date =
    timestamps.length === 0 ? null : new Date(Math.min(...timestamps));

  return {
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
    duties_and_taxes: Number(container.duties_and_taxes),
    supplier: {
      supplier_id: container.supplier_id,
      supplier_code: container.supplier.supplier_code,
      name: container.supplier.name,
      sales_remittance_account: container.supplier.sales_remittance_account,
    },
    arrival_date: container.arrival_date
      ? formatDate(container.arrival_date, date_format)
      : undefined,
    due_date: container.due_date
      ? formatDate(container.due_date, date_format)
      : undefined,
    auction_start_date: auction_start_date
      ? formatDate(new Date(auction_start_date), date_format)
      : "N/A",
    created_at: formatDate(container.created_at, date_format),
    updated_at: formatDate(container.updated_at, date_format),
    deleted_at: container.deleted_at
      ? formatDate(container.deleted_at, date_format)
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
      auction_date: item.auction_date
        ? formatDate(item.auction_date, date_format)
        : "---",
      created_at: formatDate(item.created_at, date_format),
      updated_at: formatDate(item.updated_at, date_format),
      deleted_at: item.deleted_at
        ? formatDate(item.deleted_at, date_format)
        : null,
      auctions_inventory: item.auctions_inventory
        ? {
            auction_inventory_id: item.auctions_inventory?.auction_inventory_id,
            auction_bidder_id: item.auctions_inventory?.auction_bidder_id,
            inventory_id: item.auctions_inventory?.inventory_id,
            receipt_id: item.auctions_inventory?.receipt_id,
            description: item.auctions_inventory?.description,
            status: item.auctions_inventory?.status,
            price: item.auctions_inventory?.price,
            qty: item.auctions_inventory?.qty,
            manifest_number: item.auctions_inventory?.manifest_number,
            is_slash_item: item.auctions_inventory?.is_slash_item,
            auction_date: item.auctions_inventory
              ? formatDate(item.auctions_inventory?.auction_date, date_format)
              : "",
            created_at: item.auctions_inventory
              ? formatDate(item.auctions_inventory?.created_at, date_format)
              : "",
            updated_at: item.auctions_inventory
              ? formatDate(item.auctions_inventory?.updated_at, date_format)
              : "",
            bidder: {
              bidder_id:
                item.auctions_inventory?.auction_bidder.bidder.bidder_id,
              bidder_number:
                item.auctions_inventory?.auction_bidder.bidder.bidder_number,
              full_name: `${item.auctions_inventory?.auction_bidder.bidder.first_name} ${item.auctions_inventory?.auction_bidder.bidder.last_name}`,
              service_charge:
                item.auctions_inventory?.auction_bidder.service_charge,
              registration_fee:
                item.auctions_inventory?.auction_bidder.registration_fee,
              already_consumed:
                item.auctions_inventory?.auction_bidder.already_consumed,
              balance: item.auctions_inventory?.auction_bidder.balance,
            },
          }
        : null,
    })),
  };
};

export const GetContainerByBarcodeController = async (barcode: string) => {
  try {
    const container = await getContainerByBarcodeUseCase(barcode);
    return ok(presenter(container));
  } catch (error) {
    logger("GetContainerByBarcodeController", error);
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error!",
        cause: error.message,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
