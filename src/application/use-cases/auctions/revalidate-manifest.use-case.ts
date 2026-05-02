import {
  AuctionRepository,
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import { UploadManifestInput } from "src/entities/models/Manifest";
import {
  addContainerIdForNewInventories,
  formatControlDescriptionQty,
  formatExistingInventories,
  normalizeManifestDescriptions,
  removeManifestDuplicates,
  removeMonitoringDuplicates,
  validateBidders,
} from "./manifest-pipeline";

export const revalidateManifestUseCase = async (
  auction_id: string,
  data: UploadManifestInput[],
) => {
  const [monitoring, registered_bidders, existing_inventories, containers] =
    await Promise.all([
      AuctionRepository.getMonitoring("ALL", ["UNPAID", "PAID", "CANCELLED", "REFUNDED"]),
      AuctionRepository.getRegisteredBiddersForManifest(auction_id),
      InventoryRepository.getAllInventoriesForManifest(),
      ContainerRepository.getContainerBarcodes(),
    ]);

  const withFormattedQty = formatControlDescriptionQty(data);
  const withNormalizedDescriptions = normalizeManifestDescriptions(
    withFormattedQty,
  );
  const withoutManifestDuplicates = removeManifestDuplicates(
    withNormalizedDescriptions,
  );
  const withValidatedBidders = validateBidders(
    withoutManifestDuplicates,
    registered_bidders,
  );
  const withExistingInventories = formatExistingInventories(
    withValidatedBidders,
    existing_inventories,
  );
  const withContainerIds = addContainerIdForNewInventories(
    withExistingInventories,
    containers,
  );
  const withoutMonitoringDuplicates = removeMonitoringDuplicates(
    withContainerIds,
    monitoring,
  );

  return withoutMonitoringDuplicates;
};
