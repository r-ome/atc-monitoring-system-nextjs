import { ManifestSheetRecord, UploadManifestInput } from "src/entities/models/Manifest";
import { InventoryForManifestRow } from "src/entities/models/Inventory";
import { ContainerBarcodeRow } from "src/entities/models/Container";
import { AuctionInventoryWithDetailsRow } from "src/entities/models/Auction";
import { AuctionBidderForManifestRow } from "src/entities/models/Bidder";
import { formatNumberPadding } from "@/app/lib/utils";
import { v4 as uuidv4 } from "uuid";

export const isThreePartBarcode = (barcode: string) =>
  barcode.split("-").length === 3;

export const getContainerBarcode = (barcode: string) =>
  isThreePartBarcode(barcode)
    ? barcode.split("-").slice(0, -1).join("-")
    : barcode;

export const validateEmptyFields = (
  data: ManifestSheetRecord[],
): UploadManifestInput[] => {
  return data.map((item) => {
    const required = [
      "BARCODE",
      "BIDDER",
      // "PRICE"
    ] as const;
    const empty_fields = required.filter((field) => !item[field]);

    const CONTROL = item.CONTROL ? formatNumberPadding(item.CONTROL, 4) : "NC";
    const QTY = item.QTY
      ? item.QTY == "0.5"
        ? "1/2"
        : item.QTY.toString()
      : item.QTY;
    const BIDDER = formatNumberPadding((item.BIDDER || "").toString(), 4);
    const MANIFEST = item.MANIFEST ? item.MANIFEST.toString().trim() : "";
    // TEMPORARILY ADD PRICE FOR EMPTY PRICE FIELDS
    const PRICE = item.PRICE ? item.PRICE : "0";

    if (!empty_fields.length) {
      return {
        ...item,
        CONTROL,
        QTY,
        BIDDER,
        MANIFEST,
        PRICE,
        isValid: true,
        error: "",
        forInventoryUpdate: false,
        forUpdating: false,
        isSlashItem: "",
      };
    }

    return {
      ...item,
      CONTROL,
      QTY,
      BIDDER,
      MANIFEST,
      PRICE,
      isValid: false,
      forUpdating: false,
      forInventoryUpdate: false,
      isSlashItem: "",
      error: `Required Fields: ${empty_fields.join(", ")}`,
    };
  });
};

export const formatControlDescriptionQty = (
  data: UploadManifestInput[],
): UploadManifestInput[] => {
  return data.map((item) => {
    if (!item.isValid) return item;
    return {
      ...item,
      DESCRIPTION: item.DESCRIPTION || "NO DESCRIPTION",
      QTY: item.QTY || "NO QTY",
      MANIFEST: item.MANIFEST || "NO MANIFEST",
      CONTROL: !item.CONTROL
        ? "NC"
        : formatNumberPadding(item.CONTROL.replace(/\./g, ""), 4),
      BIDDER: formatNumberPadding(item.BIDDER, 4),
    };
  });
};

export const divideIntoHundreds = (total: number, parts: number) => {
  const portion = total / parts;
  const rounded_portions = Array(parts)
    .fill(0)
    .map(() => Math.round(portion / 100) * 100);
  const difference = total - rounded_portions.reduce((a, b) => a + b, 0);
  rounded_portions[rounded_portions.length - 1] += difference;
  return rounded_portions;
};

export const divideQuantites = (qty: string | number, parts: number) => {
  const match = String(qty).match(/^(\d+)\s*(\w+)?$/i);
  if (!match) return Array(parts).fill(String(qty));

  const [, numStr, unit = ""] = match;
  const total = parseInt(numStr, 10);

  if (/LOT|SET/i.test(String(qty)))
    return Array.from({ length: parts }, () => String(qty));

  if (total === 1)
    return Array.from({ length: parts }, () => `1${unit ? " " + unit : ""}`);

  const base = Math.floor(total / parts);
  const remainder = total % parts;

  return Array.from({ length: parts }, (_, i) => {
    const value = i < remainder ? base + 1 : base;
    return `${value}${unit ? " " + unit : ""}`;
  });
};

export const formatSlashedBarcodes = (
  data: UploadManifestInput[],
): UploadManifestInput[] => {
  return data.reduce((acc, item) => {
    const new_barcodes = item.BARCODE.split("/");
    const new_control = item.CONTROL.split("/");

    const parent = getContainerBarcode(new_barcodes[0]);

    const new_prices = divideIntoHundreds(
      parseInt(item.PRICE, 10),
      new_barcodes.length,
    );
    const new_quantities = divideQuantites(item.QTY, new_barcodes.length);
    const slashGroupUuid = new_barcodes.length > 1 ? uuidv4() : null;

    const new_rows = new_barcodes.map((new_barcode, i) => {
      const is_inventory = !new_barcode.includes("-");
      new_barcode = formatNumberPadding(new_barcode, 3);

      return {
        ...item,
        isSlashItem: slashGroupUuid,
        PRICE: new_prices[i].toString(),
        BARCODE: is_inventory ? `${parent}-${new_barcode}` : new_barcode,
        QTY: new_quantities[i].toString(),
        CONTROL:
          new_control.length > 1
            ? new_control[i] ?? new_control[new_control.length - 1]
            : new_control.join(""),
      };
    });

    return [...acc, ...new_rows];
  }, [] as UploadManifestInput[]);
};

export const validateBidders = (
  data: UploadManifestInput[],
  registeredBidders: AuctionBidderForManifestRow[],
) => {
  const bidderMap = new Map(
    registeredBidders.map((b) => [b.bidder.bidder_number, b]),
  );

  return data.map((item) => {
    if (!item.isValid) return item;
    const bidder = bidderMap.get(item.BIDDER);

    if (!bidder) {
      return {
        ...item,
        isValid: false,
        error: `${item.BIDDER} is not registered`,
      };
    }

    if (bidder.bidder.status === "BANNED") {
      return {
        ...item,
        isValid: false,
        error: `${item.BIDDER} is banned`,
      };
    }

    return {
      ...item,
      auction_bidder_id: bidder.auction_bidder_id,
      service_charge: bidder.service_charge,
    };
  });
};

export const removeManifestDuplicates = (
  data: UploadManifestInput[],
): UploadManifestInput[] => {
  const seen = new Set<string>();

  return data.map((item) => {
    if (!item.isValid) return item;
    let key = item.BARCODE;

    if (!isThreePartBarcode(item.BARCODE)) {
      key = `${item.BARCODE}-${item.CONTROL}`;
    }

    if (seen.has(key)) {
      return { ...item, isValid: false, error: "DUPLICATE BARCODE" };
    } else {
      seen.add(key);
      return item;
    }
  });
};

/**
 * This function checks all inventories and compares it to the manifest.
 * If there are no existing inventories, it will return the inventory_id with a null value
 * indicating that a new inventory needs to be created.
 *
 * SCENARIO A: barcode has a container barcode (3-part, e.g. 32-04-001)
 *   - check by barcode alone; if SOLD → error
 * SCENARIO B: barcode has no container barcode (2-part, e.g. 32-04)
 *   - check by barcode + control; if SOLD → error
 */
export const formatExistingInventories = (
  data: UploadManifestInput[],
  existing_inventories: InventoryForManifestRow[],
): UploadManifestInput[] => {
  const byBarcode = new Map<string, InventoryForManifestRow>();
  const byBarcodeControl = new Map<string, InventoryForManifestRow>();

  for (const inv of existing_inventories) {
    byBarcode.set(inv.barcode, inv);
    byBarcodeControl.set(`${inv.barcode}:${inv.control}`, inv);
  }

  return data.map((item) => {
    if (!item.isValid) return item;

    const existing_inventory = isThreePartBarcode(item.BARCODE)
      ? byBarcode.get(item.BARCODE)
      : byBarcodeControl.get(`${item.BARCODE}:${item.CONTROL}`);

    if (!existing_inventory) return item;

    if (existing_inventory.status === "SOLD") {
      return { ...item, isValid: false, error: "Item already exists and SOLD in inventories" };
    }

    return {
      ...item,
      forUpdating: true,
      inventory_id: existing_inventory.inventory_id,
      container_id: existing_inventory.container_id,
    };
  });
};

export const addContainerIdForNewInventories = (
  data: UploadManifestInput[],
  containers: ContainerBarcodeRow[],
): UploadManifestInput[] => {
  const containerMap = new Map(
    containers.map((c) => [c.barcode, c.container_id]),
  );

  return data.map((item) => {
    if (!item.isValid) return item;
    if (item.inventory_id) return item;

    const item_container_barcode = getContainerBarcode(item.BARCODE);
    const container_id = containerMap.get(item_container_barcode);

    if (!container_id) {
      return { ...item, isValid: false, error: `${item_container_barcode} does not exist in Containers` };
    }

    return { ...item, container_id };
  });
};

export const removeMonitoringDuplicates = (
  data: UploadManifestInput[],
  monitoring: AuctionInventoryWithDetailsRow[],
) => {
  const existing_monitoring = new Set(
    monitoring.map((item) =>
      `${item.inventory.barcode}:${item.inventory.control}`,
    ),
  );

  /**
   * If item already exists but has CANCELLED, REFUNDED, or BOUGHT_ITEM status,
   * update the auction_inventory instead of creating a new one.
   */
  const cancelledByBarcode = new Map<string, AuctionInventoryWithDetailsRow>();
  const cancelledByBarcodeControl = new Map<string, AuctionInventoryWithDetailsRow>();

  const monitoringByBarcode = new Map<string, AuctionInventoryWithDetailsRow>();
  const monitoringByBarcodeControl = new Map<string, AuctionInventoryWithDetailsRow>();

  for (const item of monitoring) {
    monitoringByBarcode.set(item.inventory.barcode, item);
    monitoringByBarcodeControl.set(
      `${item.inventory.barcode}:${item.inventory.control}`,
      item,
    );

    if (
      ["CANCELLED", "REFUNDED"].includes(item.status) ||
      ["BOUGHT_ITEM"].includes(item.inventory.status)
    ) {
      cancelledByBarcode.set(item.inventory.barcode, item);
      cancelledByBarcodeControl.set(
        `${item.inventory.barcode}:${item.inventory.control}`,
        item,
      );
    }
  }

  return data.map((sheet_item) => {
    if (!sheet_item.isValid) return sheet_item;

    const key = `${sheet_item.BARCODE}:${sheet_item.CONTROL}`;

    const cancelled = isThreePartBarcode(sheet_item.BARCODE)
      ? cancelledByBarcode.get(sheet_item.BARCODE)
      : cancelledByBarcodeControl.get(key);

    if (cancelled) {
      const matched_item = isThreePartBarcode(sheet_item.BARCODE)
        ? monitoringByBarcode.get(sheet_item.BARCODE)
        : monitoringByBarcodeControl.get(key);

      return {
        ...sheet_item,
        forUpdating: true,
        ...(matched_item ? { auction_inventory_id: matched_item.auction_inventory_id } : {}),
      };
    }

    if (existing_monitoring.has(key)) {
      return { ...sheet_item, isValid: false, error: "DUPLICATE ENCODE" };
    }

    return sheet_item;
  });
};
