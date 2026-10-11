import { logger } from "@/app/lib/logger";
import { formatDate } from "@/app/lib/utils";
import { BranchRepository, ReportsRepository } from "src/infrastructure/di/repositories";
import { err, ok } from "src/entities/models/Result";
import type { BranchRow } from "src/entities/models/Branch";
import {
  auctionBranchComparisonSchema,
  type AuctionBranchComparison,
  type AuctionBranchKpiRow,
  type AuctionBranchMetrics,
} from "src/entities/models/Report";

function emptyMetrics(): AuctionBranchMetrics {
  return {
    total_sales: 0,
    items_sold: 0,
    bidder_attendances: 0,
    total_registration_fee: 0,
    highest_item_sold: 0,
    avg_selling_price: 0,
    auction_count: 0,
  };
}

function addAuction(metrics: AuctionBranchMetrics, row: AuctionBranchKpiRow) {
  metrics.total_sales += row.total_sales;
  metrics.items_sold += row.items_sold;
  metrics.bidder_attendances += row.registered_bidders;
  metrics.total_registration_fee += row.total_registration_fee;
  metrics.highest_item_sold = Math.max(metrics.highest_item_sold, row.highest_item_sold);
  metrics.auction_count++;
}

export function presentAuctionBranchComparison(
  branches: BranchRow[],
  rows: AuctionBranchKpiRow[],
  year: string,
): AuctionBranchComparison {
  const entries = branches.map((branch) => ({
    branch_id: branch.branch_id,
    branch_name: branch.name,
    summary: emptyMetrics(),
    months: Array.from({ length: 12 }, (_, index) => ({
      month: `${year}-${String(index + 1).padStart(2, "0")}`,
      ...emptyMetrics(),
    })),
  }));
  const byBranch = new Map(entries.map((entry) => [entry.branch_id, entry]));
  for (const row of rows) {
    const branch = byBranch.get(row.branch_id);
    if (!branch || formatDate(row.auction_date, "yyyy") !== year) continue;
    const monthIndex = Number(formatDate(row.auction_date, "MM")) - 1;
    addAuction(branch.months[monthIndex], row);
    addAuction(branch.summary, row);
  }
  for (const branch of entries) {
    for (const metrics of [branch.summary, ...branch.months]) {
      metrics.avg_selling_price = metrics.items_sold > 0
        ? Math.round(metrics.total_sales / metrics.items_sold)
        : 0;
    }
  }
  return { year, branches: entries };
}

export const GetAuctionBranchComparisonController = async (input: Record<string, unknown>) => {
  const parsed = auctionBranchComparisonSchema.safeParse(input);
  if (!parsed.success) {
    return err({ message: "Invalid comparison filters", cause: parsed.error.flatten().fieldErrors });
  }
  try {
    const branches = (await BranchRepository.getBranches())
      .filter((branch) => !branch.deleted_at && branch.name !== "ALL");
    const { year, branch_ids } = parsed.data;
    const selectedIds = branch_ids ? new Set(branch_ids) : null;
    if (selectedIds && [...selectedIds].some((id) => !branches.some((branch) => branch.branch_id === id))) {
      return err({ message: "Invalid comparison branches", cause: "Select active branches from the branch list." });
    }
    const selectedBranches = selectedIds
      ? branches.filter((branch) => selectedIds.has(branch.branch_id))
      : branches;
    const rows = selectedBranches.length > 0
      ? await ReportsRepository.getAuctionBranchComparison(selectedBranches.map((branch) => branch.branch_id), year)
      : [];
    return ok(presentAuctionBranchComparison(selectedBranches, rows, year));
  } catch (error) {
    logger("GetAuctionBranchComparisonController", error);
    return err({ message: "Failed to load branch comparison", cause: "Please try again." });
  }
};
