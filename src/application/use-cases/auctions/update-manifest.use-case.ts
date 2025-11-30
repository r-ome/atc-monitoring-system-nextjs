import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import {
  BaseInventorySchema,
  InventorySchema,
} from "src/entities/models/Inventory";
import { ManifestUpdateSchema } from "src/entities/models/Manifest";
import { RegisteredBidderSchema } from "src/entities/models/Bidder";
import { AuctionsInventorySchema } from "src/entities/models/Auction";
import { getAllInventoriesUseCase } from "../inventories/get-all-inventories.use-case";
import { ContainerSchema } from "src/entities/models/Container";
import { getContainersUseCase } from "../containers/get-containers.use-case";
import { divideIntoHundreds, divideQuantites } from "@/app/lib/sheets";
import { formatNumberPadding } from "@/app/lib/utils";
import { getMonitoringUseCase } from "./get-monitoring.use-case";
import { winston_logger } from "@/app/lib/logger";

export const updateManifestUseCase = async (
  auction_id: string,
  manifest_id: string,
  data: ManifestUpdateSchema
) => {
  const registered_bidders = await AuctionRepository.getRegisteredBidders(
    auction_id
  );

  const existing_inventories = await getAllInventoriesUseCase();
  const containers = await getContainersUseCase();
  const monitoring = await getMonitoringUseCase(auction_id, [
    "UNPAID",
    "PAID",
    "CANCELLED",
    "REFUNDED",
  ]);

  const something1 = formatSlashedBarcodes(data);
  const something2 = validateBidders(something1, registered_bidders);
  const something3 = formatExistingInventories(
    something2,
    existing_inventories
  );
  const something4 = addContainerIdForNewInventories(something3, containers);
  const something5 = removeMonitoringDuplicates(something4, monitoring);

  const something = await AuctionRepository.updateManifest(
    manifest_id,
    something5,
    data
  );

  winston_logger.info(
    something5.filter((item) =>
      item.error.includes("Required Fields: BARCODE, BIDDER, PRICE")
    )
  );

  return something;
};

const validateBidders = (
  data: ManifestUpdateSchema[],
  registeredBidders: RegisteredBidderSchema[]
) => {
  return data.map((item) => {
    const bidder = registeredBidders.find(
      (registered_bidder) =>
        registered_bidder.bidder.bidder_number === item.bidder_number
    );

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
  data: ManifestUpdateSchema[],
  existing_inventories: Omit<
    InventorySchema,
    "histories" | "container" | "auctions_inventories"
  >[]
): ManifestUpdateSchema[] => {
  return data.map((item) => {
    if (!item.isValid) return item;
    // check if it has inventory barcode (e.g. 27-01-01) (the 3 digit from the combination)
    // if barcode is only a combination of container barcode we skip it and consider it as new inventory
    const has_inventory_barcode = item.barcode.split("-").length === 3;
    if (!has_inventory_barcode) return item;

    const existing_inventory = existing_inventories.find(
      (inventory) => inventory.barcode === item.barcode
    );

    if (existing_inventory)
      if (["SOLD"].includes(existing_inventory.status)) {
        item.isValid = false;
        item.error = "Item already exists and SOLD in inventories";
      } else {
        item.isValid = true;
        item.error = "";
        item.inventory_id = existing_inventory.inventory_id;
      }

    return item;
  });
};

const addContainerIdForNewInventories = (
  data: ManifestUpdateSchema[],
  containers: (Omit<ContainerSchema, "inventories"> & {
    inventories: BaseInventorySchema[];
  })[]
): ManifestUpdateSchema[] => {
  return data.map((item) => {
    if (!item.isValid) return item;
    if (item.inventory_id) return item;

    const container_barcodes = containers.map((container) => ({
      container_id: container.container_id,
      barcode: container.barcode,
    }));

    const item_container_barcode =
      item.barcode.split("-").length === 3
        ? item.barcode.split("-").slice(0, -1).join("-")
        : item.barcode;

    const container = container_barcodes.find(
      (container_barcode) =>
        container_barcode.barcode === item_container_barcode
    );

    if (!container) {
      item.isValid = false;
      item.error = `${item_container_barcode} does not exist in Containers`;
      return item;
    }

    item.container_id = container.container_id;
    return item;
  });
};

const formatSlashedBarcodes = (
  data: ManifestUpdateSchema
): ManifestUpdateSchema[] => {
  const new_barcodes = data.barcode.split("/");
  const new_control = data.control.split("/");

  const parent =
    new_barcodes[0].split("-").length === 3
      ? new_barcodes[0].split("-").slice(0, -1).join("-")
      : new_barcodes[0];

  const new_prices = divideIntoHundreds(
    parseInt(data.price, 10),
    new_barcodes.length
  );
  const new_quantities = divideQuantites(data.qty, new_barcodes.length);

  const new_rows = new_barcodes.map((new_barcode, i) => {
    const is_inventory = new_barcode.split("-").length === 1;
    new_barcode = formatNumberPadding(new_barcode, 3);

    return {
      ...data,
      bidder_number: formatNumberPadding(data.bidder_number, 4),
      isValid: true,
      error: "",
      price: new_prices[i].toString(),
      barcode: is_inventory ? `${parent}-${new_barcode}` : new_barcode,
      qty: new_quantities[i].toString(),
      control:
        new_control && new_control.length > 1
          ? new_control[i]
            ? new_control[i]
            : "NC"
          : new_control && new_control.join(""),
    };
  });

  return new_rows;
};

const removeMonitoringDuplicates = (
  data: ManifestUpdateSchema[],
  monitoring: AuctionsInventorySchema[]
) => {
  const existing_monitoring = monitoring.map((item) =>
    JSON.stringify({
      BARCODE: item.inventory.barcode,
      CONTROL: item.inventory.control,
      DESCRIPTION: item.description,
      BIDDER: item.auction_bidder.bidder.bidder_number,
      QTY: item.qty,
      PRICE: item.price.toString(),
    })
  );

  return data.map((item) => {
    if (!item.isValid) return item;

    const fields = JSON.stringify({
      BARCODE: item.barcode,
      CONTROL: item.control,
      DESCRIPTION: item.description,
      BIDDER: item.bidder_number,
      QTY: item.qty,
      PRICE: item.price.toString(),
    });

    // if items exists in monitoring but has a cancelled or refunded status, reassign item to new bidder

    if (existing_monitoring.includes(fields)) {
      item.isValid = false;
      item.error = "DUPLICATE ENCODE";
      return item;
    }

    return item;
  });
};
