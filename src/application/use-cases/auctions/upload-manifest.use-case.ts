import { AuctionRepository, ContainerRepository, InventoryRepository } from "src/infrastructure/di/repositories";
import { ManifestSheetRecord } from "src/entities/models/Manifest";
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
import { winston_logger } from "@/app/lib/logger";

export const uploadManifestUseCase = async (
  auction_id: string,
  data: ManifestSheetRecord[],
  is_bought_items: boolean = false,
) => {
  const monitoring = await AuctionRepository.getMonitoring("ALL", [
    "UNPAID",
    "PAID",
    "CANCELLED",
    "REFUNDED",
  ]);

  const registered_bidders = await AuctionRepository.getRegisteredBidders(auction_id);
  const existing_inventories = await InventoryRepository.getAllInventories();
  const containers = await ContainerRepository.getContainers();

  const withEmptyFieldsValidated = validateEmptyFields(data);
  const withFormattedQty = formatControlDescriptionQty(withEmptyFieldsValidated);
  const withFormattedBarcodes = formatSlashedBarcodes(withFormattedQty);
  const withoutManifestDuplicates = removeManifestDuplicates(withFormattedBarcodes);
  const withValidatedBidders = validateBidders(withoutManifestDuplicates, registered_bidders);
  const withExistingInventories = formatExistingInventories(
    withValidatedBidders,
    existing_inventories,
  );

  const withContainerIds = addContainerIdForNewInventories(withExistingInventories, containers);
  const withoutMonitoringDuplicates = removeMonitoringDuplicates(withContainerIds, monitoring);

  winston_logger.info(
    withoutMonitoringDuplicates.filter((item) =>
      item.error.includes("Required Fields: BARCODE, BIDDER, PRICE"),
    ),
  );

  return await AuctionRepository.uploadManifest(
    auction_id,
    withoutMonitoringDuplicates,
    is_bought_items,
  );
};
