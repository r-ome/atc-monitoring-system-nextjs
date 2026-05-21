import { getContainerByBarcodeUseCase } from "src/application/use-cases/containers/get-container-by-barcode.use-case";
import {
  ContainerWithDetailsAndAuctionHistoriesRow,
  FinalReportBoughtItemModification,
  FinalReportMergeModification,
  FinalReportTaxDeductionItem,
  FinalReportVoidedItemModification,
} from "src/entities/models/Container";
import {
  FinalReportDocumentType,
  FinalReportFile,
} from "src/entities/models/ContainerFile";
import { DatabaseOperationError, NotFoundError } from "src/entities/errors/common";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { parseInventoryHistoryRemark } from "src/entities/models/InventoryHistoryRemark";
import { finalReportDraftSchema } from "src/entities/models/FinalReportDraft";

const isFinalReportDocumentType = (
  document_type: ContainerWithDetailsAndAuctionHistoriesRow[
    "container_files"
  ][number]["document_type"],
): document_type is FinalReportDocumentType =>
  document_type === "FINAL_REPORT_ORIGINAL" ||
  document_type === "FINAL_REPORT_MODIFIED";

const isGeneratedFinalReportFile = (
  file: ContainerWithDetailsAndAuctionHistoriesRow["container_files"][number],
): file is ContainerWithDetailsAndAuctionHistoriesRow[
  "container_files"
][number] & {
  document_type: FinalReportDocumentType;
} => isFinalReportDocumentType(file.document_type);

type ContainerInventoryItem =
  ContainerWithDetailsAndAuctionHistoriesRow["inventories"][number];

function getBidderNumberFromHistory(
  history: ContainerInventoryItem["histories"][number],
) {
  const receiptBidder = history.receipt?.auction_bidder?.bidder;
  if (receiptBidder) return receiptBidder.bidder_number;

  const parsed = parseInventoryHistoryRemark(history.remarks);
  return parsed.bidder_number ?? null;
}

function getUpdatedBidderNumberFromHistoryRemark(remarks: string | null) {
  return remarks?.match(/Updated bidder_number:\s*\S+\s+to\s+(\S+)/i)?.[1] ?? null;
}

const getAuctionInventoryHistoryInfo = (item: ContainerInventoryItem) => {
  const auction_inventory = item.auctions_inventory;
  if (!auction_inventory) {
    return { reason: null, bidder_number: null };
  }

  if (
    auction_inventory.status !== "CANCELLED" &&
    auction_inventory.status !== "REFUNDED"
  ) {
    return { reason: null, bidder_number: null };
  }

  const histories = [...item.histories, ...auction_inventory.histories].sort(
    (a, b) => b.created_at.getTime() - a.created_at.getTime(),
  );
  const relevantHistories = histories.filter(
    (history) => history.auction_status === auction_inventory.status,
  );
  let reason: string | null = null;
  let bidder_number: string | null = null;

  for (const history of relevantHistories) {
    bidder_number ??= getBidderNumberFromHistory(history);

    if (history.receipt?.remarks) {
      reason = history.receipt.remarks;
      break;
    }

    const parsed = parseInventoryHistoryRemark(history.remarks);
    reason = parsed.reason ?? history.remarks ?? null;
    if (reason) break;
  }

  if (!bidder_number) {
    for (const history of histories) {
      bidder_number = getUpdatedBidderNumberFromHistoryRemark(history.remarks);
      if (bidder_number) break;
    }
  }

  return { reason, bidder_number };
};

function getFinalReportTaxDeductionSummary(
  container: ContainerWithDetailsAndAuctionHistoriesRow,
): {
  total: number;
  source: "draft" | "persisted" | null;
  items: FinalReportTaxDeductionItem[];
} {
  const draft = finalReportDraftSchema.safeParse(container.final_report_draft);
  if (draft.success && draft.data.tax_edits.length > 0) {
    // Build lookup of inventories by `${barcode}|${control}` for enrichment.
    const lookup = new Map<
      string,
      {
        description: string;
        price: number;
        bidder_number: string | null;
      }
    >();
    for (const inv of container.inventories) {
      const control = inv.control ?? "NC";
      const key = `${inv.barcode}|${control}`;
      const ai = inv.auctions_inventory;
      lookup.set(key, {
        description: inv.description ?? "",
        price: Number(ai?.price ?? 0),
        bidder_number: ai?.auction_bidder?.bidder?.bidder_number ?? null,
      });
    }

    const items: FinalReportTaxDeductionItem[] = draft.data.tax_edits
      .filter((e) => e.deducted_amount > 0)
      .map((e) => {
        const info = lookup.get(`${e.barcode}|${e.control}`);
        // Raw DB price is the gross/pre-deduction price — deductions are only
        // applied in the preview/workbook output, never written back.
        const original_price = info?.price ?? 0;
        const new_price = Math.max(0, original_price - e.deducted_amount);
        return {
          control: e.control || "NC",
          description: info?.description ?? "",
          bidder_number: info?.bidder_number ?? null,
          original_price,
          deducted_amount: e.deducted_amount,
          new_price,
        };
      });

    return {
      total: items.reduce((sum, item) => sum + item.deducted_amount, 0),
      source: "draft" as const,
      items,
    };
  }

  const taxDeduction = container.tax_deduction;
  if (taxDeduction && typeof taxDeduction === "object" && "items" in taxDeduction) {
    const rawItems = (taxDeduction as { items?: unknown }).items;
    if (!Array.isArray(rawItems)) {
      return { total: 0, source: null, items: [] };
    }

    const items: FinalReportTaxDeductionItem[] = [];
    for (const raw of rawItems) {
      if (!raw || typeof raw !== "object") continue;
      const r = raw as Record<string, unknown>;
      const deducted_amount = Number(r.deducted_amount ?? 0);
      if (!Number.isFinite(deducted_amount) || deducted_amount <= 0) continue;
      const original_price = Number(r.original_price ?? 0);
      items.push({
        control: typeof r.control === "string" ? r.control : "",
        description: typeof r.description === "string" ? r.description : "",
        bidder_number:
          typeof r.bidder_number === "string" ? r.bidder_number : null,
        original_price: Number.isFinite(original_price) ? original_price : 0,
        deducted_amount,
        new_price: Math.max(
          0,
          (Number.isFinite(original_price) ? original_price : 0) -
            deducted_amount,
        ),
      });
    }

    return {
      total: items.reduce((sum, item) => sum + item.deducted_amount, 0),
      source: "persisted" as const,
      items,
    };
  }

  return { total: 0, source: null, items: [] };
}

function getFinalReportModifications(
  container: ContainerWithDetailsAndAuctionHistoriesRow,
): {
  source: "draft" | "persisted" | null;
  bought_items: FinalReportBoughtItemModification[];
  voided_items: FinalReportVoidedItemModification[];
  merges: FinalReportMergeModification[];
} {
  const empty = {
    source: null as "draft" | "persisted" | null,
    bought_items: [] as FinalReportBoughtItemModification[],
    voided_items: [] as FinalReportVoidedItemModification[],
    merges: [] as FinalReportMergeModification[],
  };

  const byInventoryId = new Map<
    string,
    { barcode: string; control: string; description: string }
  >();
  for (const inv of container.inventories) {
    byInventoryId.set(inv.inventory_id, {
      barcode: inv.barcode,
      control: inv.control ?? "NC",
      description: inv.description ?? "",
    });
  }

  // Prefer the in-progress draft when one exists so the panel reflects what the
  // user is staging right now. Falls back to the persisted snapshot from the
  // last finalize.
  const draft = finalReportDraftSchema.safeParse(container.final_report_draft);
  if (
    draft.success &&
    (draft.data.bought_items.length > 0 ||
      draft.data.merged_inventories.length > 0)
  ) {
    const bought_items: FinalReportBoughtItemModification[] = [];
    const voided_items: FinalReportVoidedItemModification[] = [];
    for (const item of draft.data.bought_items) {
      const inv = byInventoryId.get(item.inventory_id);
      if (item.action === "VOID") {
        voided_items.push({
          barcode: inv?.barcode ?? "",
          control: inv?.control ?? "NC",
          description: inv?.description ?? "",
        });
      } else {
        bought_items.push({
          barcode: inv?.barcode ?? "",
          control: inv?.control ?? "NC",
          description: inv?.description ?? "",
          bidder_number: item.bidder_number,
          auction_date: item.auction_date,
          price: item.price,
          qty: item.qty,
        });
      }
    }
    const merges: FinalReportMergeModification[] =
      draft.data.merged_inventories.map((m) => {
        const sold = byInventoryId.get(m.old_inventory_id);
        const unsold = byInventoryId.get(m.new_inventory_id);
        return {
          sold: {
            barcode: sold?.barcode ?? "",
            control: sold?.control ?? "NC",
            description: sold?.description ?? "",
          },
          unsold: {
            barcode: unsold?.barcode ?? "",
            control: unsold?.control ?? "NC",
            description: unsold?.description ?? "",
          },
        };
      });
    return { source: "draft", bought_items, voided_items, merges };
  }

  const changes = container.final_report_changes;
  if (changes && typeof changes === "object") {
    const c = changes as Record<string, unknown>;
    const readArr = (key: string) =>
      Array.isArray(c[key]) ? (c[key] as unknown[]) : [];

    const bought_items: FinalReportBoughtItemModification[] = readArr(
      "bought_items",
    ).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const r = raw as Record<string, unknown>;
      return [
        {
          barcode: String(r.barcode ?? ""),
          control: String(r.control ?? "NC"),
          description: String(r.description ?? ""),
          bidder_number: String(r.bidder_number ?? ""),
          auction_date: String(r.auction_date ?? ""),
          price: Number(r.price ?? 0),
          qty: String(r.qty ?? ""),
        },
      ];
    });

    const voided_items: FinalReportVoidedItemModification[] = readArr(
      "voided_items",
    ).flatMap((raw) => {
      if (!raw || typeof raw !== "object") return [];
      const r = raw as Record<string, unknown>;
      return [
        {
          barcode: String(r.barcode ?? ""),
          control: String(r.control ?? "NC"),
          description: String(r.description ?? ""),
        },
      ];
    });

    const merges: FinalReportMergeModification[] = readArr("merges").flatMap(
      (raw) => {
        if (!raw || typeof raw !== "object") return [];
        const r = raw as Record<string, unknown>;
        const sold = (r.sold ?? {}) as Record<string, unknown>;
        const unsold = (r.unsold ?? {}) as Record<string, unknown>;
        return [
          {
            sold: {
              barcode: String(sold.barcode ?? ""),
              control: String(sold.control ?? "NC"),
              description: String(sold.description ?? ""),
            },
            unsold: {
              barcode: String(unsold.barcode ?? ""),
              control: String(unsold.control ?? "NC"),
              description: String(unsold.description ?? ""),
            },
          },
        ];
      },
    );

    if (
      bought_items.length > 0 ||
      voided_items.length > 0 ||
      merges.length > 0
    ) {
      return { source: "persisted", bought_items, voided_items, merges };
    }
  }

  return empty;
}

export const presentContainerDetails = (
  container: ContainerWithDetailsAndAuctionHistoriesRow,
) => {
  const date_format = "MMM dd, yyyy";
  const status: "PAID" | "UNPAID" = container.status ? "PAID" : "UNPAID";
  const taxDeductionSummary = getFinalReportTaxDeductionSummary(container);
  const finalReportModifications = getFinalReportModifications(container);
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
    final_report_tax_deduction_total: taxDeductionSummary.total,
    final_report_tax_deduction_source: taxDeductionSummary.source,
    final_report_tax_deduction_items: taxDeductionSummary.items,
    final_report_modifications: finalReportModifications,
    inventories: container.inventories.map((item) => {
      const historyInfo = getAuctionInventoryHistoryInfo(item);

      return {
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
        sales_allocation: item.sales_allocation,
        sales_allocation_reason: item.sales_allocation_reason,
        sales_allocation_note: item.sales_allocation_note,
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
            reason: historyInfo.reason,
            price: item.auctions_inventory?.price,
            qty: item.auctions_inventory?.qty,
            manifest_number: item.auctions_inventory?.manifest_number,
            is_slash_item: item.auctions_inventory?.is_slash_item,
            auction_date: item.auctions_inventory
              ? formatDate(item.auctions_inventory?.auction_date, date_format)
              : "",
            sale_year: item.auctions_inventory?.auction_date
              ? new Date(item.auctions_inventory.auction_date).getFullYear()
              : null,
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
                historyInfo.bidder_number ??
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
      };
    }),
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
