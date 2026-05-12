import { getContainerByBarcodeUseCase } from "src/application/use-cases/containers/get-container-by-barcode.use-case";
import { ContainerWithDetailsRow } from "src/entities/models/Container";
import {
  FinalReportDocumentType,
  FinalReportFile,
} from "src/entities/models/ContainerFile";
import { DatabaseOperationError, NotFoundError } from "src/entities/errors/common";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";

const isFinalReportDocumentType = (
  document_type: ContainerWithDetailsRow["container_files"][number]["document_type"],
): document_type is FinalReportDocumentType =>
  document_type === "FINAL_REPORT_ORIGINAL" ||
  document_type === "FINAL_REPORT_MODIFIED";

const isGeneratedFinalReportFile = (
  file: ContainerWithDetailsRow["container_files"][number],
): file is ContainerWithDetailsRow["container_files"][number] & {
  document_type: FinalReportDocumentType;
} => isFinalReportDocumentType(file.document_type);

export const presentContainerDetails = (container: ContainerWithDetailsRow) => {
  const date_format = "MMM dd, yyyy";
  const status: "PAID" | "UNPAID" = container.status ? "PAID" : "UNPAID";
  const containerReportFiles = container.container_files.filter(
    (file) => file.document_type === "CONTAINER_REPORT",
  );
  const generatedFinalReportFiles = container.container_files.filter(
    isGeneratedFinalReportFile,
  );
  const current_report_file_id = containerReportFiles[0]?.container_file_id;
  const latestFinalReportVersion = generatedFinalReportFiles[0]?.version;
  const latestFinalReportFiles = generatedFinalReportFiles.filter(
    (file) => file.version === latestFinalReportVersion,
  );
  const presentFinalReportFile = (
    file: (typeof latestFinalReportFiles)[number],
  ): FinalReportFile => ({
    container_file_id: file.container_file_id,
    document_type: file.document_type,
    variant:
      file.document_type === "FINAL_REPORT_ORIGINAL"
        ? ("original" as const)
        : ("modified" as const),
    version: file.version,
    original_filename: file.original_filename,
    content_type: file.content_type,
    size_bytes: file.size_bytes,
    uploaded_by: file.uploaded_by,
    uploaded_at: formatDate(file.uploaded_at, date_format),
  });

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
    auction_or_sell: container.auction_or_sell,
    status,
    paid_at: container.status ? formatDate(container.status, date_format) : null,
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
    container_report_files: containerReportFiles.map((item) => ({
      container_file_id: item.container_file_id,
      document_type: item.document_type,
      version: item.version,
      original_filename: item.original_filename,
      content_type: item.content_type,
      size_bytes: item.size_bytes,
      uploaded_by: item.uploaded_by,
      uploaded_at: formatDate(item.uploaded_at, date_format),
      current: item.container_file_id === current_report_file_id,
    })),
    final_report_files: latestFinalReportVersion
      ? {
          version: latestFinalReportVersion,
          original:
            latestFinalReportFiles
              .filter((file) => file.document_type === "FINAL_REPORT_ORIGINAL")
              .map(presentFinalReportFile)[0] ?? null,
          modified:
            latestFinalReportFiles
              .filter((file) => file.document_type === "FINAL_REPORT_MODIFIED")
              .map(presentFinalReportFile)[0] ?? null,
        }
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
    return ok(presentContainerDetails(container));
  } catch (error) {
    if (error instanceof NotFoundError) {
      logger("GetContainerByBarcodeController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

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
