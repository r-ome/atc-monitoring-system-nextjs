import {
  ManifestSheetRecord,
  ManifestInsertSchema,
} from "src/entities/models/Manifest";
import * as xlsx from "xlsx";
import { formatNumberPadding } from "./utils";
import {
  BaseInventorySchema,
  InventorySchema,
} from "src/entities/models/Inventory";
import { ContainerSchema } from "src/entities/models/Container";
import { AuctionsInventorySchema } from "src/entities/models/Auction";
import { RegisteredBidderSchema } from "src/entities/models/Bidder";
import { InputParseError } from "src/entities/errors/common";
import { logger } from "./logger";

export const VALID_FILE_TYPES = [
  "application/x-iwork-numbers-sffnumbers",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

export const getSheetData = (
  file: ArrayBuffer,
  type: "manifest" | "inventory" = "inventory"
): { data: Record<string, string>[]; headers: string[] } => {
  try {
    const workbook = xlsx.read(file, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    let data = xlsx.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: true,
    }) as Record<string, string>[];

    let headers: string[] = [];
    if (type === "manifest") {
      headers = [];
      headers = Object.values(data[1])
        .filter((item) => item)
        .map((item) => item.trim());
      data = data
        .slice(1)
        .map<Record<string, string>>((item) =>
          headers.reduce(
            (acc, header, headerIndex) => ({
              ...acc,
              [header]: Object.values(item)[headerIndex],
            }),
            {}
          )
        )
        .map((item1) => ({
          BARCODE: item1.BARCODE,
          CONTROL: item1["CONTROL #"],
          DESCRIPTION: item1.DESCRIPTION,
          BIDDER: item1["BIDDER #"],
          PRICE: item1.PRICE,
          QTY: item1.QTY,
          MANIFEST: item1["MANIFEST NUMBER"],
        }))
        .filter((item) => {
          return (
            JSON.stringify(item) !==
            `{"BARCODE":"","CONTROL":"","DESCRIPTION":"","BIDDER":"","PRICE":"","QTY":"","MANIFEST":""}`
          );
        });
    } else {
      headers = data.length ? Object.keys(data[0]) : [];
    }

    return { data, headers };
  } catch (error) {
    logger("getSheetData", error);
    throw new InputParseError("Invalid Data!", {
      cause: { file: ["Sheet uploaded has wrong format!"] },
    });
  }
};

export const validateEmptyFields = (
  data: ManifestSheetRecord[]
): ManifestInsertSchema[] => {
  return data.map((item) => {
    const required = ["BARCODE", "BIDDER", "PRICE"] as const;
    const emptyFields = required.filter((field) => !item[field]);
    item.CONTROL = item.CONTROL ? formatNumberPadding(item.CONTROL, 4) : "NC";
    if (item.QTY) {
      if (item.QTY == "0.5") {
        item.QTY = "1/2";
      }
      item.QTY = item.QTY.toString();
    }

    item.BIDDER = formatNumberPadding((item.BIDDER || "").toString(), 4);
    item.MANIFEST = item.MANIFEST ? item.MANIFEST.toString().trim() : "";

    if (!emptyFields.length) {
      return { ...item, isValid: true, error: "", forReassign: false };
    }

    return {
      ...item,
      isValid: false,
      forReassign: false,
      error: `Required Fields: ${emptyFields.join(", ")}`,
    };
  });
};

export const formatControlDescriptionQty = (
  data: ManifestInsertSchema[]
): ManifestInsertSchema[] => {
  return data.map((item) => {
    if (!item.isValid) return item;
    if (!item.DESCRIPTION) item.DESCRIPTION = "NO DESCRIPTION";
    if (!item.QTY) item.QTY = "NO QTY";
    if (!item.MANIFEST) item.MANIFEST = "NO MANIFEST";
    item.CONTROL = !item.CONTROL ? "NC" : formatNumberPadding(item.CONTROL, 4);
    item.BIDDER = formatNumberPadding(item.BIDDER, 4);

    return item;
  });
};

const divideIntoHundreds = (total: number, parts: number) => {
  const portion = total / parts;
  const rounded_portions = Array(parts)
    .fill(0)
    .map(() => Math.round(portion / 100) * 100);
  const difference = total - rounded_portions.reduce((a, b) => a + b, 0);
  rounded_portions[rounded_portions.length - 1] += difference;
  return rounded_portions;
};

export const formatSlashedBarcodes = (
  data: ManifestInsertSchema[]
): ManifestInsertSchema[] => {
  return data.reduce((acc, item) => {
    const new_barcodes = item.BARCODE.split("/");
    const new_control = item.CONTROL.split("/");

    const parent =
      new_barcodes[0].split("-").length === 3
        ? new_barcodes[0].split("-").slice(0, -1).join("-")
        : new_barcodes[0];

    const new_prices = divideIntoHundreds(
      parseInt(item.PRICE, 10),
      new_barcodes.length
    );
    const new_rows = new_barcodes.map((new_barcode, i) => {
      const is_inventory = new_barcode.split("-").length === 1;
      new_barcode = formatNumberPadding(new_barcode, 3);

      return {
        ...item,
        BARCODE: is_inventory ? `${parent}-${new_barcode}` : new_barcode,
        CONTROL:
          new_control && new_control.length > 1
            ? new_control[i]
              ? new_control[i]
              : "NC"
            : new_control && new_control.join(""),
        PRICES: new_prices[i],
      };
    });

    return [...acc, ...new_rows];
  }, [] as ManifestInsertSchema[]);
};

export const validateBidders = (
  data: ManifestInsertSchema[],
  registeredBidders: RegisteredBidderSchema[]
) => {
  return data.map((item) => {
    if (!item.isValid) return item;
    const bidder = registeredBidders.find(
      (registered_bidder) =>
        registered_bidder.bidder.bidder_number === item.BIDDER
    );

    if (!bidder) {
      return {
        ...item,
        isValid: false,
        error: `${item.BIDDER} is not registered`,
      };
    }

    item.auction_bidder_id = bidder.auction_bidder_id;
    item.service_charge = bidder.service_charge;
    return item;
  });
};

export const formatExistingInventories = (
  data: ManifestInsertSchema[],
  existing_inventories: Omit<
    InventorySchema,
    "histories" | "container" | "auctions_inventories"
  >[]
): ManifestInsertSchema[] => {
  return data.map((item) => {
    if (!item.isValid) return item;

    // check if it has inventory barcode (e.g. 27-01-01) (the 3 digit from the combination)
    // if barcode is only a combination of container barcode we skip it and consider it as new inventory
    const has_inventory_barcode = item.BARCODE.split("-").length === 3;
    if (!has_inventory_barcode) return item;

    const existing_inventory = existing_inventories.find(
      (inventory) => inventory.barcode === item.BARCODE
    );

    if (existing_inventory)
      if (["SOLD"].includes(existing_inventory.status)) {
        item.isValid = false;
        item.error = "Item already exists and SOLD in inventories";
      } else item.inventory_id = existing_inventory.inventory_id;

    return item;
  });
};

export const addContainerIdForNewInventories = (
  data: ManifestInsertSchema[],
  containers: (Omit<ContainerSchema, "inventories"> & {
    inventories: BaseInventorySchema[];
  })[]
): ManifestInsertSchema[] => {
  return data.map((item) => {
    if (!item.isValid) return item;
    if (item.inventory_id) return item;

    const container_barcodes = containers.map((container) => ({
      container_id: container.container_id,
      barcode: container.barcode,
    }));

    const item_container_barcode =
      item.BARCODE.split("-").length === 3
        ? item.BARCODE.split("-").slice(0, -1).join("-")
        : item.BARCODE;

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

export const removeDuplicates = (
  data: ManifestInsertSchema[],
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

  return data.map((sheet_item) => {
    if (!sheet_item.isValid) return sheet_item;

    const fields = JSON.stringify({
      BARCODE: sheet_item.BARCODE,
      CONTROL: sheet_item.CONTROL,
      DESCRIPTION: sheet_item.DESCRIPTION,
      BIDDER: sheet_item.BIDDER,
      QTY: sheet_item.QTY,
      PRICE: sheet_item.PRICE.toString(),
    });

    const sheet_bidder = sheet_item.BIDDER;
    // if items exists in monitoring but has a cancelled or refunded status, reassign item to new bidder
    const existing_cancelled_items = monitoring
      .filter((item) => ["CANCELLED", "REFUNDED"].includes(item.status))
      .map((item) =>
        JSON.stringify({
          BARCODE: item.inventory.barcode,
          CONTROL: item.inventory.control,
          DESCRIPTION: item.description,
          BIDDER: sheet_bidder,
          QTY: item.qty,
          PRICE: item.price.toString(),
        })
      );

    if (existing_cancelled_items.includes(fields)) {
      const matched_item = monitoring.find(
        (item) => item.inventory.barcode === sheet_item.BARCODE
      );

      sheet_item.forReassign = true;
      if (matched_item) {
        sheet_item.auction_inventory_id = matched_item.auction_inventory_id;
      }
      return sheet_item;
    }

    if (existing_monitoring.includes(fields)) {
      sheet_item.isValid = false;
      sheet_item.error = "DUPLICATE ENCODE";
      return sheet_item;
    }

    return sheet_item;
  });
};
