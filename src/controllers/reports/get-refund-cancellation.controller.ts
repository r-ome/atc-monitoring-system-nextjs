import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { RefundCancellationRow, RefundCancellationEntry } from "src/entities/models/Report";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { formatDate } from "@/app/lib/utils";

function resolveOriginalBidder(row: RefundCancellationRow): {
  bidder_number: string;
  bidder_name: string;
} {
  const currentBidder = row.auction_bidder.bidder;

  // If current holder is 5013, look through histories for the original bidder
  if (currentBidder.bidder_number === ATC_DEFAULT_BIDDER_NUMBER) {
    for (const history of row.histories) {
      // Paid items: trace via receipt → auction_bidder
      const historyBidder = history.receipt?.auction_bidder?.bidder;
      if (historyBidder && historyBidder.bidder_number !== ATC_DEFAULT_BIDDER_NUMBER) {
        return {
          bidder_number: historyBidder.bidder_number,
          bidder_name: `${historyBidder.first_name} ${historyBidder.last_name}`,
        };
      }

      // Unpaid items: parse from remarks (e.g. "Cancelled from bidder #5013 (John Doe): REASON")
      if (!history.receipt && history.remarks) {
        const match = history.remarks.match(/^Cancelled from bidder #(\S+) \((.+?)\):/);
        if (match) {
          return { bidder_number: match[1], bidder_name: match[2] };
        }
      }
    }
  }

  return {
    bidder_number: currentBidder.bidder_number,
    bidder_name: `${currentBidder.first_name} ${currentBidder.last_name}`,
  };
}

function resolveReason(row: RefundCancellationRow): string {
  for (const history of row.histories) {
    if (!["CANCELLED", "REFUNDED"].includes(history.auction_status)) continue;
    // Paid cancelled/refunded items: receipt.remarks contains the raw reason
    if (history.receipt?.remarks) return history.receipt.remarks;
    // Unpaid items (new format): parse reason after the bidder prefix
    if (history.remarks) {
      const match = history.remarks.match(/^(?:Cancelled|REFUNDED) from bidder #\S+ \(.+?\): (.+)$/);
      if (match) return match[1];
      // Older/full refund format stores the reason directly in remarks text.
      return history.remarks;
    }
  }
  return "";
}

function presenter(rows: RefundCancellationRow[]): RefundCancellationEntry[] {
  return rows.map((row) => {
    const { bidder_number, bidder_name } = resolveOriginalBidder(row);
    return {
      auction_inventory_id: row.auction_inventory_id,
      auction_date: formatDate(row.auction_bidder.auctions.created_at, "MMM dd, yyyy"),
      bidder_number,
      bidder_name,
      description: row.description,
      barcode: row.inventory.barcode,
      control: row.inventory.control,
      price: row.price,
      status: row.status,
      reason: resolveReason(row),
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
