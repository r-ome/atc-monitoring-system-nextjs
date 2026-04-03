import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { RefundCancellationRow, RefundCancellationEntry } from "src/entities/models/Report";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { formatDate } from "@/app/lib/utils";
import { parseInventoryHistoryRemark } from "src/entities/models/InventoryHistoryRemark";

function getRelevantHistories(row: RefundCancellationRow) {
  return row.histories.filter((history) =>
    ["CANCELLED", "REFUNDED"].includes(history.auction_status),
  );
}

function getPrimaryRelevantHistory(row: RefundCancellationRow) {
  return getRelevantHistories(row)
    .slice()
    .sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0] ?? null;
}

function resolveBidderFromLegacyHistoryRemark(remarks: string | null | undefined) {
  const parsed = parseInventoryHistoryRemark(remarks);
  if (!parsed.bidder_number || !parsed.bidder_name) return null;

  return {
    bidder_number: parsed.bidder_number,
    bidder_name: parsed.bidder_name,
  };
}

function resolveReasonFromLegacyHistoryRemark(remarks: string | null | undefined) {
  const parsed = parseInventoryHistoryRemark(remarks);
  return parsed.reason ?? remarks ?? "";
}

function resolveUpdatedByFromHistoryRemark(remarks: string | null | undefined) {
  const parsed = parseInventoryHistoryRemark(remarks);
  return parsed.updated_by ?? null;
}

function resolveOriginalBidder(row: RefundCancellationRow): {
  bidder_number: string;
  bidder_name: string;
} {
  const currentBidder = row.auction_bidder.bidder;

  // If current holder is 5013, look through histories for the original bidder
  if (currentBidder.bidder_number === ATC_DEFAULT_BIDDER_NUMBER) {
    for (const history of getRelevantHistories(row)) {
      // Structured source for paid refund/cancellation rows.
      const historyBidder = history.receipt?.auction_bidder?.bidder;
      if (historyBidder && historyBidder.bidder_number !== ATC_DEFAULT_BIDDER_NUMBER) {
        return {
          bidder_number: historyBidder.bidder_number,
          bidder_name: `${historyBidder.first_name} ${historyBidder.last_name}`,
        };
      }
    }

    for (const history of getRelevantHistories(row)) {
      // Legacy fallback for unpaid rows after auction_bidder_id has been reassigned.
      if (history.receipt) continue;

      const bidder = resolveBidderFromLegacyHistoryRemark(history.remarks);
      if (bidder) {
        return bidder;
      }
    }
  }

  return {
    bidder_number: currentBidder.bidder_number,
    bidder_name: `${currentBidder.first_name} ${currentBidder.last_name}`,
  };
}

function resolveReason(row: RefundCancellationRow): string {
  for (const history of getRelevantHistories(row)) {
    // Structured source for paid refund/cancellation rows.
    if (history.receipt?.remarks) return history.receipt.remarks;
  }

  for (const history of getRelevantHistories(row)) {
    if (!history.receipt) return resolveReasonFromLegacyHistoryRemark(history.remarks);
  }

  return "";
}

function resolveUpdatedBy(row: RefundCancellationRow): string | null {
  for (const history of getRelevantHistories(row)) {
    const updated_by = resolveUpdatedByFromHistoryRemark(history.remarks);
    if (updated_by) return updated_by;
  }

  return null;
}

function presenter(rows: RefundCancellationRow[]): RefundCancellationEntry[] {
  return rows.map((row) => {
    const { bidder_number, bidder_name } = resolveOriginalBidder(row);
    return {
      auction_inventory_id: row.auction_inventory_id,
      auction_date: formatDate(row.auction_bidder.auctions.created_at, "MMM dd, yyyy"),
      status_date: formatDate(
        getPrimaryRelevantHistory(row)?.created_at ?? row.updated_at,
        "MMM dd, yyyy",
      ),
      bidder_number,
      bidder_name,
      description: row.description,
      barcode: row.inventory.barcode,
      control: row.inventory.control,
      price: row.price,
      status: row.status,
      reason: resolveReason(row),
      updated_by: resolveUpdatedBy(row),
    };
  });
}

export function presentRefundCancellation(rows: RefundCancellationRow[]): RefundCancellationEntry[] {
  return presenter(rows);
}

export const GetRefundCancellationController = async (
  branch_id: string,
  date: string,
) => {
  try {
    const rows = await ReportsRepository.getRefundCancellationItems(branch_id, date);
    return ok(presenter(rows));
  } catch (error) {
    logger("GetRefundCancellationController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};
