import { PriceComparisonRow, PriceComparisonEntry } from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

function presenter(rows: PriceComparisonRow[]): PriceComparisonEntry[] {
  type MonthAccumulator = {
    sortKey: string;
    sortDate: Date;
    old_prices: number[];
    new_prices: number[];
  };

  const monthMap = new Map<string, MonthAccumulator>();

  for (const row of rows) {
    if (!row.auctions_inventory) continue;
    const auction = row.auctions_inventory.auction_bidder.auctions;
    const sortKey = formatDate(auction.created_at, "yyyy-MM");

    if (!monthMap.has(sortKey)) {
      monthMap.set(sortKey, {
        sortKey,
        sortDate: auction.created_at,
        old_prices: [],
        new_prices: [],
      });
    }

    const acc = monthMap.get(sortKey)!;
    if (row.is_bought_item !== null) acc.old_prices.push(row.is_bought_item);
    acc.new_prices.push(row.auctions_inventory.price);
  }

  return Array.from(monthMap.values())
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((acc) => ({
      month: formatDate(acc.sortDate, "MMM yyyy"),
      avg_old_price:
        acc.old_prices.length > 0
          ? Math.round(acc.old_prices.reduce((s, v) => s + v, 0) / acc.old_prices.length)
          : 0,
      avg_new_price:
        acc.new_prices.length > 0
          ? Math.round(acc.new_prices.reduce((s, v) => s + v, 0) / acc.new_prices.length)
          : 0,
      item_count: acc.new_prices.length,
    }));
}

export function presentPriceComparison(rows: PriceComparisonRow[]): PriceComparisonEntry[] {
  return presenter(rows);
}
