type InventoryLike = {
  auctions_inventory: {
    status: string;
    price: number;
    bidder?: { service_charge?: number | null } | null;
  } | null;
};

export type ContainerReportData = {
  totalItemSales: number;
  totalServiceCharge: number;
  royalty: number;
  containerSalesCommission: number;
  atcGroupCommission: number;
  sortingFee: number;
  atcSales: number;
  totalProfit: number;
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
  inventories: InventoryLike[]
): ContainerReportData {
  const paidAuctionItems = inventories.flatMap((inv) => {
    if (inv.auctions_inventory?.status === "PAID") {
      return [inv.auctions_inventory];
    }
    return [];
  });

  const totalItemSales = paidAuctionItems.reduce((sum, item) => {
    return sum + (item.price ?? 0);
  }, 0);

  const totalServiceCharge = paidAuctionItems.reduce((sum, item) => {
    const serviceChargeRate = item.bidder?.service_charge ?? 0;
    return sum + ((item.price ?? 0) * serviceChargeRate) / 100;
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
    totalServiceCharge,
    royalty,
    containerSalesCommission,
    atcGroupCommission,
    sortingFee,
    atcSales,
    totalProfit,
  };
}
