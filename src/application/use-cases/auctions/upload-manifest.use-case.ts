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
  uploaded_by?: string,
) => {
  const [monitoring, registered_bidders, existing_inventories, containers] =
    await Promise.all([
      AuctionRepository.getMonitoring("ALL", ["UNPAID", "PAID", "CANCELLED", "REFUNDED"]),
      AuctionRepository.getRegisteredBiddersForManifest(auction_id),
      InventoryRepository.getAllInventoriesForManifest(),
      ContainerRepository.getContainerBarcodes(),
    ]);

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
    uploaded_by,
  );
};
