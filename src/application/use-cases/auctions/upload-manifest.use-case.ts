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
  removeDuplicates,
} from "@/app/lib/sheets";
import { getRegisteredBiddersUseCase } from "./get-registered-bidders.use-case";
import { getContainersUseCase } from "../containers/get-containers.use-case";
import { getAllInventoriesUseCase } from "../inventories/get-all-inventories.use-case";
import { winston_logger } from "@/app/lib/logger";

export const uploadManifestUseCase = async (
  auction_id: string,
  data: ManifestSheetRecord[]
) => {
  const monitoring = await getMonitoringUseCase(auction_id, [
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
  const something2 = formatSlashedBarcodes(something1);
  const something3 = validateBidders(something2, registered_bidders);
  const something4 = formatExistingInventories(
    something3,
    existing_inventories
  );
  const something5 = addContainerIdForNewInventories(something4, containers);
  const something6 = removeDuplicates(something5, monitoring);

  winston_logger.info(something6);

  return await AuctionRepository.uploadManifest(auction_id, something6);
};
