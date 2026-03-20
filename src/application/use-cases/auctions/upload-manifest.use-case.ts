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
} from "src/application/use-cases/auctions/manifest-pipeline";

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

  return await AuctionRepository.uploadManifest(
    auction_id,
    withoutMonitoringDuplicates,
    is_bought_items,
  );
};
