import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import { ManifestSheetRecord } from "src/entities/models/Manifest";
import { getMonitoringUseCase } from "./get-monitoring.use-case";
import {
  formatControlDescriptionQty,
  formatSlashedBarcodes,
  validateBidders,
  validateEmptyFields,
  formatExistingInventories,
  addContainerIdForNewInventories,
  removeMonitoringDuplicates,
  removeManifestDuplicates,
} from "@/app/lib/sheets";
import { getRegisteredBiddersUseCase } from "./get-registered-bidders.use-case";
import { getContainersUseCase } from "../containers/get-containers.use-case";
import { getAllInventoriesUseCase } from "../inventories/get-all-inventories.use-case";
import { winston_logger } from "@/app/lib/logger";

export const uploadManifestUseCase = async (
  auction_id: string,
  data: ManifestSheetRecord[],
  is_bought_items: boolean = false,
) => {
  const monitoring = await getMonitoringUseCase("ALL", [
    "UNPAID",
    "PAID",
    "CANCELLED",
    "REFUNDED",
  ]);

  const registered_bidders = await getRegisteredBiddersUseCase(auction_id);
  const existing_inventories = await getAllInventoriesUseCase();
  const containers = await getContainersUseCase();

  const something = validateEmptyFields(data);
  const something1 = formatControlDescriptionQty(something);
  const something2 = removeManifestDuplicates(something1);
  const something3 = formatSlashedBarcodes(something2);
  const something4 = validateBidders(something3, registered_bidders);
  const something5 = formatExistingInventories(
    something4,
    existing_inventories,
  );

  const something6 = addContainerIdForNewInventories(something5, containers);
  const something7 = removeMonitoringDuplicates(something6, monitoring);

  winston_logger.info(
    something6.filter((item) =>
      item.error.includes("Required Fields: BARCODE, BIDDER, PRICE"),
    ),
  );

  return await AuctionRepository.uploadManifest(
    auction_id,
    something7,
    is_bought_items,
  );
};
