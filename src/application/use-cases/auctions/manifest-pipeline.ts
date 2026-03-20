import { ManifestSheetRecord, UploadManifestInput } from "src/entities/models/Manifest";
import { InventoryRow } from "src/entities/models/Inventory";
import { ContainerWithAllRow } from "src/entities/models/Container";
import { AuctionInventoryWithDetailsRow } from "src/entities/models/Auction";
import { AuctionBidderWithFullDetailsRow } from "src/entities/models/Bidder";
import { formatNumberPadding } from "@/app/lib/utils";
import { v4 as uuidv4 } from "uuid";

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

    const parent =
      new_barcodes[0].split("-").length === 3
        ? new_barcodes[0].split("-").slice(0, -1).join("-")
        : new_barcodes[0];

    const new_prices = divideIntoHundreds(
      parseInt(item.PRICE, 10),
      new_barcodes.length,
    );
    const new_quantities = divideQuantites(item.QTY, new_barcodes.length);
    const slashGroupUuid = new_barcodes.length > 1 ? uuidv4() : null;

    const new_rows = new_barcodes.map((new_barcode, i) => {
      const is_inventory = new_barcode.split("-").length === 1;
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
  registeredBidders: AuctionBidderWithFullDetailsRow[],
) => {
  return data.map((item) => {
    if (!item.isValid) return item;
    const bidder = registeredBidders.find(
      (registered_bidder) =>
        registered_bidder.bidder.bidder_number === item.BIDDER,
    );

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

    if (item.BARCODE.split("-").length === 2) {
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
  existing_inventories: InventoryRow[],
): UploadManifestInput[] => {
  return data.map((item) => {
    if (!item.isValid) return item;

    const existing_inventory = existing_inventories.find((inventory) => {
      if (item.BARCODE.split("-").length === 3) {
        return inventory.barcode === item.BARCODE;
      }

      return (
        inventory.barcode === item.BARCODE && inventory.control === item.CONTROL
      );
    });

    if (!existing_inventory) return item;

    if (["SOLD"].includes(existing_inventory.status)) {
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
  containers: ContainerWithAllRow[],
): UploadManifestInput[] => {
  const container_barcodes = containers.map((container) => ({
    container_id: container.container_id,
    barcode: container.barcode,
  }));

  return data.map((item) => {
    if (!item.isValid) return item;
    if (item.inventory_id) return item;

    const item_container_barcode =
      item.BARCODE.split("-").length === 3
        ? item.BARCODE.split("-").slice(0, -1).join("-")
        : item.BARCODE;

    const container = container_barcodes.find(
      (container_barcode) =>
        container_barcode.barcode === item_container_barcode,
    );

    if (!container) {
      return { ...item, isValid: false, error: `${item_container_barcode} does not exist in Containers` };
    }

    return { ...item, container_id: container.container_id };
  });
};

export const removeMonitoringDuplicates = (
  data: UploadManifestInput[],
  monitoring: AuctionInventoryWithDetailsRow[],
) => {
  const existing_monitoring = new Set(
    monitoring.map((item) =>
      JSON.stringify({
        BARCODE: item.inventory.barcode,
        CONTROL: item.inventory.control,
      }),
    ),
  );

  /**
   * If item already exists but has CANCELLED, REFUNDED, or BOUGHT_ITEM status,
   * update the auction_inventory instead of creating a new one.
   */
  const existing_cancelled_items = monitoring.filter(
    (item) =>
      ["CANCELLED", "REFUNDED"].includes(item.status) ||
      ["BOUGHT_ITEM"].includes(item.inventory.status),
  );

  return data.map((sheet_item) => {
    if (!sheet_item.isValid) return sheet_item;

    const fields = JSON.stringify({
      BARCODE: sheet_item.BARCODE,
      CONTROL: sheet_item.CONTROL,
    });

    const already_existing_cancelled_items = existing_cancelled_items.find(
      (item) => {
        if (item.inventory.barcode.split("-").length === 3) {
          return item.inventory.barcode === sheet_item.BARCODE;
        }
        return (
          item.inventory.barcode === sheet_item.BARCODE &&
          item.inventory.control === sheet_item.CONTROL
        );
      },
    );

    if (already_existing_cancelled_items) {
      const matched_item = monitoring.find((item) => {
        if (item.inventory.barcode.split("-").length === 3) {
          return item.inventory.barcode === sheet_item.BARCODE;
        }

        return (
          item.inventory.barcode === sheet_item.BARCODE &&
          item.inventory.control === sheet_item.CONTROL
        );
      });

      return {
        ...sheet_item,
        forUpdating: true,
        ...(matched_item ? { auction_inventory_id: matched_item.auction_inventory_id } : {}),
      };
    }

    if (existing_monitoring.has(fields)) {
      return { ...sheet_item, isValid: false, error: "DUPLICATE ENCODE" };
    }

    return sheet_item;
  });
};
