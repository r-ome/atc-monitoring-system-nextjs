import type {
  FinalReportAvailableBidder,
  FinalReportMonitoringRow,
} from "src/entities/models/FinalReport";

export const reassign5013ToRandomBidders = (
  monitoring: FinalReportMonitoringRow[],
  availableBidders: FinalReportAvailableBidder[],
): { monitoring: FinalReportMonitoringRow[]; reassignedCount: number } => {
  const allNon5013 = availableBidders.filter(
    (bidder) => bidder.bidder_number !== "5013",
  );
  const poolByAuction = new Map<string, FinalReportAvailableBidder[]>();

  for (const bidder of allNon5013) {
    const pool = poolByAuction.get(bidder.auction_id) ?? [];
    pool.push(bidder);
    poolByAuction.set(bidder.auction_id, pool);
  }

  let reassignedCount = 0;
  const result = monitoring.map((row) => {
    if (row.bidder_number !== "5013") return row;

    const sameAuctionPool = poolByAuction.get(row.auction_id) ?? [];
    const pool = sameAuctionPool.length > 0 ? sameAuctionPool : allNon5013;
    if (pool.length === 0) return row;

    const pick = pool[Math.floor(Math.random() * pool.length)];
    reassignedCount++;
    return {
      ...row,
      bidder_number: pick.bidder_number,
      auction_bidder_id: pick.auction_bidder_id,
    };
  });

  return { monitoring: result, reassignedCount };
};
