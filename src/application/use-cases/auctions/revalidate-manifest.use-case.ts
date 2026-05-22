import {
  AuctionRepository,
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import {
  ManifestSheetRecord,
  UploadManifestInput,
} from "src/entities/models/Manifest";
import {
  addContainerIdForNewInventories,
  formatSlashedBarcodes,
  formatControlDescriptionQty,
  formatExistingInventories,
  normalizeManifestDescriptions,
  removeManifestDuplicates,
  removeMonitoringDuplicates,
  validateEmptyFields,
  validateBidders,
} from "./manifest-pipeline";

const toManifestSheetRecord = (
  item: UploadManifestInput,
): ManifestSheetRecord => ({
  BARCODE: item.BARCODE,
  CONTROL: item.CONTROL,
  DESCRIPTION: item.DESCRIPTION,
  BIDDER: item.BIDDER,
  PRICE: item.PRICE,
  QTY: item.QTY,
  MANIFEST: item.MANIFEST ?? "",
});

const preservePreviewMetadata = (
  data: UploadManifestInput[],
  previousData: UploadManifestInput[],
) =>
  data.map((item, index) => ({
    ...item,
    isSlashItem: previousData[index]?.isSlashItem ?? item.isSlashItem,
  }));

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

  const cleanRows = data.map(toManifestSheetRecord);
  const withEmptyFieldsValidated = preservePreviewMetadata(
    validateEmptyFields(cleanRows),
    data,
  );
  const withFormattedQty = formatControlDescriptionQty(
    withEmptyFieldsValidated,
  );
  const withNormalizedDescriptions = normalizeManifestDescriptions(
    withFormattedQty,
  );
  const withFormattedBarcodes = formatSlashedBarcodes(
    withNormalizedDescriptions,
  );
  const withoutManifestDuplicates = removeManifestDuplicates(
    withFormattedBarcodes,
  );
  const withValidatedBidders = validateBidders(
    withoutManifestDuplicates,
    registered_bidders,
  );
  const withExistingInventories = formatExistingInventories(
    withValidatedBidders,
    existing_inventories,
    false,
    auction_id,
  );
  const withContainerIds = addContainerIdForNewInventories(
    withExistingInventories,
    containers,
  );
  const withoutMonitoringDuplicates = removeMonitoringDuplicates(
    withContainerIds,
    monitoring,
    false,
    auction_id,
  );

  return withoutMonitoringDuplicates;
};
