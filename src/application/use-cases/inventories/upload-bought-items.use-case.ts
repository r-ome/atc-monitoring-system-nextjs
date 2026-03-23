import { uploadManifestUseCase } from "../auctions/upload-manifest.use-case";
import {
  BoughtItemsSheetRecord,
  ManifestSheetRecord,
} from "src/entities/models/Manifest";
import { AuctionRepository, InventoryRepository } from "src/infrastructure/di/repositories";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { NotFoundError } from "src/entities/errors/common";

export const uploadBoughtItemsUseCase = async (
  branch_id: string,
  data: BoughtItemsSheetRecord[],
  uploaded_by?: string,
) => {
  const auctions = await AuctionRepository.getAuctionsByBranch(branch_id);

  if (!auctions.length) {
    throw new NotFoundError("There are no available auctions");
  }

  const recent_auction = auctions[0];
  const atc_bidder = recent_auction.registered_bidders.find(
    (registered_bidder) => registered_bidder.bidder.bidder_number === ATC_DEFAULT_BIDDER_NUMBER,
  );

  if (!atc_bidder) {
    throw new NotFoundError("ATC Bidder not found!");
  }

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
    recent_auction.auction_id,
    manifest_records as ManifestSheetRecord[],
    true,
    uploaded_by,
  );

  const inventory_ids = created_auctions_inventories.map(
    (item) => item.inventory_id,
  );
  await InventoryRepository.updateBulkInventoryStatus("BOUGHT_ITEM", inventory_ids);
};
