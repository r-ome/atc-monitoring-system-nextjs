import { AuctionRepository, ContainerRepository, InventoryRepository } from "src/infrastructure/di/repositories";
import { InventoryForManifestRow } from "src/entities/models/Inventory";
import { UpdateManifestInput } from "src/entities/models/Manifest";
import { AuctionBidderForManifestRow } from "src/entities/models/Bidder";
import { AuctionInventoryWithDetailsRow } from "src/entities/models/Auction";
import { ContainerBarcodeRow } from "src/entities/models/Container";
import { divideIntoHundreds, divideQuantites, getContainerBarcode, isThreePartBarcode } from "src/application/use-cases/auctions/manifest-pipeline";
import { formatNumberPadding } from "@/app/lib/utils";
import { v4 as uuidv4 } from "uuid";

export const updateManifestUseCase = async (
  auction_id: string,
  manifest_id: string,
  data: UpdateManifestInput
) => {
  const [registered_bidders, existing_inventories, containers, monitoring] =
    await Promise.all([
      AuctionRepository.getRegisteredBiddersForManifest(auction_id),
      InventoryRepository.getAllInventoriesForManifest(),
      ContainerRepository.getContainerBarcodes(),
      AuctionRepository.getMonitoring("ALL", ["UNPAID", "PAID", "CANCELLED", "REFUNDED"]),
    ]);

  const withFormattedBarcodes = formatSlashedBarcodes(data);
  const withValidatedBidders = validateBidders(withFormattedBarcodes, registered_bidders);
  const withExistingInventories = formatExistingInventories(
    withValidatedBidders,
    existing_inventories
  );
  const withContainerIds = addContainerIdForNewInventories(withExistingInventories, containers);
  const withoutMonitoringDuplicates = removeMonitoringDuplicates(withContainerIds, monitoring);

  const result = await AuctionRepository.updateManifest(
    manifest_id,
    withoutMonitoringDuplicates,
    data
  );

  return result;
};

const validateBidders = (
  data: UpdateManifestInput[],
  registeredBidders: AuctionBidderForManifestRow[]
) => {
  const bidderMap = new Map(
    registeredBidders.map((b) => [b.bidder.bidder_number, b]),
  );

  return data.map((item) => {
    const bidder = bidderMap.get(item.bidder_number);

    if (!bidder) {
      return {
        ...item,
        isValid: false,
        error: `${item.bidder_number} is not registered`,
      };
    }

    item.auction_bidder_id = bidder.auction_bidder_id;
    item.service_charge = bidder.service_charge;
    return item;
  });
};

const formatExistingInventories = (
  data: UpdateManifestInput[],
  existing_inventories: InventoryForManifestRow[],
): UpdateManifestInput[] => {
  const inventoryByBarcode = new Map<string, InventoryForManifestRow>();
  const inventoryByBarcodeControl = new Map<string, InventoryForManifestRow>();

  for (const inventory of existing_inventories) {
    inventoryByBarcode.set(inventory.barcode, inventory);
    inventoryByBarcodeControl.set(
      `${inventory.barcode}:${inventory.control}`,
      inventory,
    );
  }

  return data.map((item) => {
    if (!item.isValid) return item;

    const existing_inventory = isThreePartBarcode(item.barcode)
      ? inventoryByBarcode.get(item.barcode)
      : inventoryByBarcodeControl.get(`${item.barcode}:${item.control}`);

    if (!existing_inventory) return item;

    if (existing_inventory.status === "SOLD") {
      item.isValid = false;
      item.error = "Item already exists and SOLD in inventories";
      return item;
    }

    item.isValid = true;
    item.error = "";
    item.inventory_id = existing_inventory.inventory_id;

    return item;
  });
};

const addContainerIdForNewInventories = (
  data: UpdateManifestInput[],
  containers: ContainerBarcodeRow[],
): UpdateManifestInput[] => {
  const containerMap = new Map(
    containers.map((c) => [c.barcode, c.container_id]),
  );

  return data.map((item) => {
    if (!item.isValid) return item;
    if (item.inventory_id) return item;

    const item_container_barcode = getContainerBarcode(item.barcode);
    const container_id = containerMap.get(item_container_barcode.trim());

    if (!container_id) {
      item.isValid = false;
      item.error = `${item_container_barcode} does not exist in Containers`;
      return item;
    }

    item.container_id = container_id;
    return item;
  });
};

const formatSlashedBarcodes = (
  data: UpdateManifestInput
): UpdateManifestInput[] => {
  const new_barcodes = data.barcode.split("/");
  const new_control = data.control.split("/");

  const parent = getContainerBarcode(new_barcodes[0]);

  const new_prices = divideIntoHundreds(
    parseInt(data.price, 10),
    new_barcodes.length
  );
  const new_quantities = divideQuantites(data.qty, new_barcodes.length);

  const slashGroupUuid = new_barcodes.length > 1 ? uuidv4() : null;

  const new_rows = new_barcodes.map((new_barcode, i) => {
    const is_inventory = !new_barcode.includes("-");
    new_barcode = formatNumberPadding(new_barcode, 3);

    return {
      ...data,
      bidder_number: formatNumberPadding(data.bidder_number, 4),
      isValid: true,
      error: "",
      isSlashItem: slashGroupUuid,
      price: new_prices[i].toString(),
      barcode: is_inventory ? `${parent}-${new_barcode}` : new_barcode,
      qty: new_quantities[i].toString(),
      control:
        new_control.length > 1
          ? new_control[i] ?? new_control[new_control.length - 1]
          : new_control.join(""),
    };
  });

  return new_rows;
};

const removeMonitoringDuplicates = (
  data: UpdateManifestInput[],
  monitoring: AuctionInventoryWithDetailsRow[]
) => {
  const monitoringByBarcode = new Map<string, AuctionInventoryWithDetailsRow>();
  const monitoringByBarcodeControl = new Map<string, AuctionInventoryWithDetailsRow>();
  const reusableByBarcode = new Map<string, AuctionInventoryWithDetailsRow>();
  const reusableByBarcodeControl = new Map<string, AuctionInventoryWithDetailsRow>();

  for (const monitoringItem of monitoring) {
    monitoringByBarcode.set(monitoringItem.inventory.barcode, monitoringItem);
    monitoringByBarcodeControl.set(
      `${monitoringItem.inventory.barcode}:${monitoringItem.inventory.control}`,
      monitoringItem,
    );

    if (["CANCELLED", "REFUNDED"].includes(monitoringItem.status)) {
      reusableByBarcode.set(monitoringItem.inventory.barcode, monitoringItem);
      reusableByBarcodeControl.set(
        `${monitoringItem.inventory.barcode}:${monitoringItem.inventory.control}`,
        monitoringItem,
      );
    }
  }

  const existingMonitoring = new Set(
    monitoring.map((item) =>
      `${item.inventory.barcode}:${item.inventory.control}:${item.description}:${item.auction_bidder.bidder.bidder_number}:${item.qty}:${item.price}`,
    ),
  );

  return data.map((item) => {
    if (!item.isValid) return item;

    const logicalKey = `${item.barcode}:${item.control}`;
    const reusableMonitoring = isThreePartBarcode(item.barcode)
      ? reusableByBarcode.get(item.barcode)
      : reusableByBarcodeControl.get(logicalKey);

    if (reusableMonitoring) {
      const matchedMonitoring = isThreePartBarcode(item.barcode)
        ? monitoringByBarcode.get(item.barcode)
        : monitoringByBarcodeControl.get(logicalKey);

      item.forUpdating = true;
      item.auction_inventory_id =
        matchedMonitoring?.auction_inventory_id ?? reusableMonitoring.auction_inventory_id;
      item.status = reusableMonitoring.status;
      item.inventory_id = reusableMonitoring.inventory_id;
      return item;
    }

    const key = `${item.barcode}:${item.control}:${item.description}:${item.bidder_number}:${item.qty}:${item.price}`;

    if (existingMonitoring.has(key)) {
      item.isValid = false;
      item.error = "DUPLICATE ENCODE";
      return item;
    }

    return item;
  });
};
