type InventoryLike = {
  sales_allocation?: string | null;
  auctions_inventory: {
    status: string;
    price: number;
    bidder?: { service_charge?: number | null } | null;
  } | null;
};

export type ContainerReportData = {
  totalItemSales: number;
  totalPaidAndUnpaidItemSales: number;
  totalServiceCharge: number;
  royalty: number;
  containerSalesCommission: number;
  atcGroupCommission: number;
  sortingFee: number;
  atcSales: number;
  totalProfit: number;
  atcAllocatedItemSales: number;
  atcAllocatedItemCount: number;
};

function computeRoyalty(sales: number): number {
  if (sales < 450_000) return 20_000;
  if (sales < 500_000) return 22_000;
  if (sales < 550_000) return 25_000;
  if (sales < 700_000) return 30_000;
  if (sales < 800_000) return 32_000;
  return 35_000;
}

function computeContainerSalesCommission(sales: number): number {
  if (sales < 700_000) return Math.round(sales * 0.25);
  if (sales <= 799_999) return Math.round(sales * 0.2);
  return Math.round(sales * 0.15);
}

export function computeContainerReport(
  inventories: InventoryLike[],
  salesBasis: "PAID" | "PAID_AND_UNPAID" = "PAID",
): ContainerReportData {
  const includedInventoryItems = inventories.flatMap((inv) => {
    if (
      inv.auctions_inventory?.status === "PAID" ||
      (salesBasis === "PAID_AND_UNPAID" &&
        inv.auctions_inventory?.status === "UNPAID")
    ) {
      return [{ inventory: inv, auction_inventory: inv.auctions_inventory }];
    }
    return [];
  });
  const containerItems = includedInventoryItems
    .filter((item) => item.inventory.sales_allocation !== "ATC")
    .map((item) => item.auction_inventory);
  const atcAllocatedItems = includedInventoryItems
    .filter((item) => item.inventory.sales_allocation === "ATC")
    .map((item) => item.auction_inventory);

  const totalItemSales = containerItems.reduce((sum, item) => {
    return sum + (item.price ?? 0);
  }, 0);
  const totalPaidAndUnpaidItemSales = inventories.reduce((sum, inv) => {
    const item = inv.auctions_inventory;
    if (
      inv.sales_allocation === "ATC" ||
      !item ||
      (item.status !== "PAID" && item.status !== "UNPAID")
    ) {
      return sum;
    }
    return sum + (item.price ?? 0);
  }, 0);

  const totalServiceCharge = containerItems.reduce((sum, item) => {
    const serviceChargeRate = item.bidder?.service_charge ?? 0;
    return sum + ((item.price ?? 0) * serviceChargeRate) / 100;
  }, 0);
  const atcAllocatedItemSales = atcAllocatedItems.reduce((sum, item) => {
    return sum + (item.price ?? 0);
  }, 0);

  const containerSalesCommission = computeContainerSalesCommission(totalItemSales);
  const atcGroupCommission = Math.round(containerSalesCommission / 3);
  const sortingFee = Math.round(totalItemSales * 0.05);
  const royalty = computeRoyalty(totalItemSales);
  const atcSales =
    containerSalesCommission - atcGroupCommission + sortingFee - royalty;
  const totalProfit = atcSales + totalServiceCharge;

  return {
    totalItemSales,
    totalPaidAndUnpaidItemSales,
    totalServiceCharge,
    royalty,
    containerSalesCommission,
    atcGroupCommission,
    sortingFee,
    atcSales,
    totalProfit,
    atcAllocatedItemSales,
    atcAllocatedItemCount: atcAllocatedItems.length,
  };
}
