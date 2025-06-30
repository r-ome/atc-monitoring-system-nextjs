import { startAuctionUseCase } from "../auctions/start-auction.use-case";
import { getAuctionUseCase } from "../auctions/get-auction.use-case";
import { uploadManifestUseCase } from "../auctions/upload-manifest.use-case";
import { startOfWeek, addDays } from "date-fns";
import {
  BoughtItemsSheetRecord,
  ManifestSheetRecord,
} from "src/entities/models/Manifest";
import { updateBulkInventoryStatusUseCase } from "./update-bulk-inventory-status.use-case";

export const uploadBoughtItemsUseCase = async (
  data: BoughtItemsSheetRecord[]
) => {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = addDays(start, 1);
  let auction = await getAuctionUseCase({ start, end });

  if (!auction) {
    auction = await startAuctionUseCase(now);
  }

  const atc_bidder = auction.registered_bidders.find(
    (registered_bidder) => registered_bidder.bidder.bidder_number === "5013"
  );

  const manifest_records = data.map((item) => ({
    BARCODE: item.BARCODE,
    CONTROL: item.CONTROL,
    DESCRIPTION: item.DESCRIPTION,
    BIDDER: atc_bidder?.bidder.bidder_number,
    PRICE: item.OLD_PRICE,
    QTY: "1",
    MANIFEST: "BOUGHT ITEM",
  }));

  const created_auctions_inventories = await uploadManifestUseCase(
    auction.auction_id,
    manifest_records as ManifestSheetRecord[]
  );

  const inventory_ids = created_auctions_inventories.map(
    (item) => item.inventory_id
  );

  await updateBulkInventoryStatusUseCase("BOUGHT_ITEM", inventory_ids);
};
