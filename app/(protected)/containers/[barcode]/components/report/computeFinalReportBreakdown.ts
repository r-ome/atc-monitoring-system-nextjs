type BreakdownInventory = {
  auction_date?: string | null;
  sales_allocation?: string | null;
  auctions_inventory: {
    status: string;
    price: number;
    bidder?: { bidder_number?: string | null } | null;
  } | null;
};

export type FinalReportBreakdown = {
  paidItemSalesTotal: number;
  atcAllocatedPaidTotal: number;
  reportsTabTotal: number;
  paidAuctionDateTotal: number;
  paidWithoutAuctionDateTotal: number;
  excludedBidder740Total: number;
  originalFinalReportTotal: number;
  taxDeductionTotal: number;
  modifiedFinalReportTotal: number;
};

const hasAuctionDate = (value?: string | null) =>
  Boolean(value && value !== "---");

export function computeFinalReportBreakdown(
  inventories: BreakdownInventory[],
  taxDeductionTotal = 0,
): FinalReportBreakdown {
  const paidItems = inventories.filter(
    (item) => item.auctions_inventory?.status === "PAID",
  );

  const paidItemSalesTotal = paidItems.reduce(
    (sum, item) => sum + (item.auctions_inventory?.price ?? 0),
    0,
  );
  const atcAllocatedPaidTotal = paidItems.reduce((sum, item) => {
    if (item.sales_allocation !== "ATC") return sum;
    return sum + (item.auctions_inventory?.price ?? 0);
  }, 0);
  const paidContainerItems = paidItems.filter(
    (item) => item.sales_allocation !== "ATC",
  );
  const reportsTabTotal = paidItemSalesTotal - atcAllocatedPaidTotal;

  const paidAuctionDateItems = paidContainerItems.filter((item) =>
    hasAuctionDate(item.auction_date),
  );
  const paidAuctionDateTotal = paidAuctionDateItems.reduce(
    (sum, item) => sum + (item.auctions_inventory?.price ?? 0),
    0,
  );

  const excludedBidder740Total = paidAuctionDateItems.reduce((sum, item) => {
    if (item.auctions_inventory?.bidder?.bidder_number !== "0740") return sum;
    return sum + (item.auctions_inventory.price ?? 0);
  }, 0);

  const originalFinalReportTotal =
    paidAuctionDateTotal - excludedBidder740Total;
  const safeTaxDeductionTotal = Math.max(0, taxDeductionTotal);

  return {
    paidItemSalesTotal,
    atcAllocatedPaidTotal,
    reportsTabTotal,
    paidAuctionDateTotal,
    paidWithoutAuctionDateTotal: reportsTabTotal - paidAuctionDateTotal,
    excludedBidder740Total,
    originalFinalReportTotal,
    taxDeductionTotal: safeTaxDeductionTotal,
    modifiedFinalReportTotal: Math.max(
      0,
      originalFinalReportTotal - safeTaxDeductionTotal,
    ),
  };
}
