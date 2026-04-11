import { UploadManifestInput } from "src/entities/models/Manifest";

export type ReusedInventoryUpdate = {
  inventory_id: string;
  data: {
    control: string;
    status: "BOUGHT_ITEM" | "SOLD";
    auction_date: Date;
    is_bought_item?: number;
  };
};

export const buildReusedInventoryUpdates = (
  items: UploadManifestInput[],
  auctionDate: Date,
  isBoughtItems = false,
): ReusedInventoryUpdate[] => {
  return items.map((item) => {
    if (!item.inventory_id) {
      throw new Error("Inventory ID does not exist");
    }

    return {
      inventory_id: item.inventory_id,
      data: {
        control: item.CONTROL,
        status: isBoughtItems ? "BOUGHT_ITEM" : "SOLD",
        auction_date: auctionDate,
        ...(isBoughtItems
          ? { is_bought_item: parseInt(item.PRICE, 10) }
          : {}),
      },
    };
  });
};
