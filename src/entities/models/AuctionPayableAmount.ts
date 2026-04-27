import { AuctionItemStatus } from "./Auction";
import { parseInventoryHistoryRemark } from "./InventoryHistoryRemark";

type AuctionInventoryHistoryForPayableAmount = {
  auction_status?: AuctionItemStatus | string | null;
  remarks?: string | null;
  created_at?: Date | string | null;
};

export type AuctionInventoryForPayableAmount = {
  status: AuctionItemStatus | string;
  price: number;
  histories?: AuctionInventoryHistoryForPayableAmount[];
};

function getLatestPriceChange(
  histories: AuctionInventoryHistoryForPayableAmount[] = [],
) {
  const priceChanges = histories
    .map((history, index) => {
      const parsed = parseInventoryHistoryRemark(history.remarks);

      if (
        typeof parsed.previous_price !== "number" ||
        typeof parsed.new_price !== "number"
      ) {
        return null;
      }

      return {
        previous_price: parsed.previous_price,
        new_price: parsed.new_price,
        created_at: history.created_at ? new Date(history.created_at).getTime() : 0,
        index,
      };
    })
    .filter((priceChange): priceChange is NonNullable<typeof priceChange> =>
      Boolean(priceChange),
    );

  if (!priceChanges.length) return null;

  return priceChanges.sort((a, b) => {
    if (b.created_at !== a.created_at) return b.created_at - a.created_at;
    return b.index - a.index;
  })[0];
}

export function getAuctionInventoryPayableBase(
  item: AuctionInventoryForPayableAmount,
) {
  if (item.status === "UNPAID") return item.price;

  if (item.status === "PARTIAL") {
    const priceChange = getLatestPriceChange(item.histories);
    if (priceChange) {
      return Math.max(priceChange.new_price - priceChange.previous_price, 0);
    }

    return item.price;
  }

  return 0;
}

export function getAuctionInventoryPayableTotal(
  item: AuctionInventoryForPayableAmount,
  serviceCharge: number,
) {
  const payableBase = getAuctionInventoryPayableBase(item);
  return payableBase + (payableBase * serviceCharge) / 100;
}

export function getAuctionInventoriesPayableBase(
  items: AuctionInventoryForPayableAmount[],
) {
  return items.reduce(
    (total, item) => total + getAuctionInventoryPayableBase(item),
    0,
  );
}
