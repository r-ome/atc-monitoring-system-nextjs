import {
  ManifestSheetRecord,
  UploadManifestInput,
} from "src/entities/models/Manifest";
import * as xlsx from "xlsx";
import { formatNumberPadding } from "./utils";
import { InventoryRow } from "src/entities/models/Inventory";
import { ContainerWithAllRow } from "src/entities/models/Container";
import { AuctionInventoryWithDetailsRow } from "src/entities/models/Auction";
import { RegisteredBidderSchema } from "src/entities/models/Bidder";
import { InputParseError } from "src/entities/errors/common";
import { logger } from "./logger";
import { v4 as uuidv4 } from "uuid";

export const VALID_FILE_TYPES = [
  "application/x-iwork-numbers-sffnumbers",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

function excelTimeToHHMMSS(v: number) {
  const totalSeconds = Math.round(v * 24 * 60 * 60);
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export const getSheetData = (
  file: ArrayBuffer,
  type:
    | "bought_items"
    | "bidders"
    | "manifest"
    | "inventory"
    | "counter_check" = "inventory",
): { data: Record<string, string>[]; headers: string[] } => {
  try {
    const workbook = xlsx.read(file, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    let data = xlsx.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: true,
      ...(type === "counter_check" ? { range: 1 } : {}),
    }) as Record<string, string>[];

    let headers: string[] = [];

    if (type === "counter_check") {
      if (!data.length) return { data: [], headers: [] };

      headers = Object.keys(data[0])
        .filter((item) => !item.startsWith("__EMPTY") && item)
        .map((item) => item.trim());

      data = data.map((item) => ({
        DESCRIPTION: item["DESCRIPTION"] ? item["DESCRIPTION"] : "",
        PAGE: item["PAGE#"] ? item["PAGE#"].toString() : "",
        CONTROL: formatNumberPadding(item.CONTROL, 4) ?? "",
        PRICE: item["TOTAL SALES"] !== "" ? item["TOTAL SALES"].toString() : "",
        BIDDER: formatNumberPadding(item.BIDDER, 4) ?? "",
        TIME: item.TIME ? excelTimeToHHMMSS(Number(item.TIME)) : "",
      }));
    }

    if (type === "manifest") {
      if (data.length < 2) return { data: [], headers: [] };

      headers = Object.values(data[1])
        .filter((item) => item)
        .map((item) => item.trim());
      data = data
        .slice(2)
        .map<Record<string, string>>((item) =>
          headers.reduce(
            (acc, header, headerIndex) => ({
              ...acc,
              [header]: Object.values(item)[headerIndex],
            }),
            {},
          ),
        )
        .map((item) => ({
          BARCODE: item.BARCODE,
          CONTROL: item["CONTROL #"],
          DESCRIPTION: item.DESCRIPTION,
          BIDDER: item["BIDDER #"],
          PRICE: item.PRICE,
          QTY: item.QTY,
          MANIFEST: item["MANIFEST NUMBER"],
        }))
        .filter((item) => Object.values(item).some(Boolean));
    }

    if (type === "inventory") {
      headers = data.length ? Object.keys(data[0]) : [];
      data = data
        .filter((item) => item.Barcode)
        .map((item) => ({
          BARCODE: item.Barcode,
          CONTROL: item.Control !== "" ? item.Control.toString() : "",
          DESCRIPTION: item.Description,
        }))
        .slice(0, -1);
    }

    if (type === "bidders") {
      if (!data.length) return { data: [], headers: [] };

      headers = Object.values(data[0]).map((item) =>
        item.trim().replace(/ /g, "_"),
      );
      data = data
        .slice(1)
        .map<Record<string, string>>((item) =>
          headers.reduce(
            (acc, header, headerIndex) => ({
              ...acc,
              [header]: Object.values(item)[headerIndex],
            }),
            {},
          ),
        )
        .map((item) => ({
          BIDDER_NUMBER: item.NEW_NUMBER,
          FIRST_NAME: item.FIRST_NAME,
          MIDDLE_NAME: item.MIDDLE_NAME,
          LAST_NAME: item.LAST_NAME,
          SERVICE_CHARGE: item["%"],
          REGISTRATION_FEE: item.REG_FEE,
          BIRTHDATE: item.BIRTH_DATE,
          CONTACT_NUMBER: item.CELLPHONE_NUMBER,
          ADDRESS: item.ADDRESS,
          TIN: item.TIN_NUMBER,
        }));
    }

    if (type === "bought_items") {
      headers = data.length ? Object.keys(data[0]) : [];
      data = data.map((item) => ({
        BARCODE: item.BARCODE,
        CONTROL: item.CONTROL !== "" ? item.CONTROL.toString() : "",
        DESCRIPTION: item.DESCRIPTION,
        NEW_PRICE: item["NEW PRICE"],
        OLD_PRICE: item["OLD PRICE"],
      }));
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
  data: ManifestSheetRecord[],
): UploadManifestInput[] => {
  return data.map((item) => {
    const required = [
      "BARCODE",
      "BIDDER",
      // "PRICE"
    ] as const;
    const empty_fields = required.filter((field) => !item[field]);
    item.CONTROL = item.CONTROL ? formatNumberPadding(item.CONTROL, 4) : "NC";
    if (item.QTY) {
      if (item.QTY == "0.5") {
        item.QTY = "1/2";
      }
      item.QTY = item.QTY.toString();
    }

    item.BIDDER = formatNumberPadding((item.BIDDER || "").toString(), 4);
    item.MANIFEST = item.MANIFEST ? item.MANIFEST.toString().trim() : "";
    // TEMPORARILY ADD PRICE FOR EMPTY PRICE FIELDS
    item.PRICE = item.PRICE ? item.PRICE : "0";

    if (!empty_fields.length) {
      return {
        ...item,
        isValid: true,
        error: "",
        forInventoryUpdate: false,
        forUpdating: false,
        isSlashItem: "",
      };
    }

    return {
      ...item,
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
    if (!item.DESCRIPTION) item.DESCRIPTION = "NO DESCRIPTION";
    if (!item.QTY) item.QTY = "NO QTY";
    if (!item.MANIFEST) item.MANIFEST = "NO MANIFEST";
    item.CONTROL = !item.CONTROL
      ? "NC"
      : formatNumberPadding(item.CONTROL.replace(/\./g, ""), 4);
    item.BIDDER = formatNumberPadding(item.BIDDER, 4);

    return item;
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
          new_control && new_control.length > 1
            ? new_control[i]
              ? new_control[i]
              : "NC"
            : new_control && new_control.join(""),
      };
    });

    return [...acc, ...new_rows];
  }, [] as UploadManifestInput[]);
};

export const validateBidders = (
  data: UploadManifestInput[],
  registeredBidders: RegisteredBidderSchema[],
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

    item.auction_bidder_id = bidder.auction_bidder_id;
    item.service_charge = bidder.service_charge;
    return item;
  });
};

export const removeManifestDuplicates = (
  data: UploadManifestInput[],
): UploadManifestInput[] => {
  const seen = new Set<string>();

  return data.map((item) => {
    if (!item.isValid) return item;
    let key = item.BARCODE;
    if (item.BARCODE.split("-").length === 3) {
      key = item.BARCODE;
    }

    if (item.BARCODE.split("-").length === 2) {
      key = `${item.BARCODE}-${item.CONTROL}`;
    }

    if (seen.has(key)) {
      return { ...item, isValid: false, error: "DUPLICATE MANIFEST" };
    } else {
      seen.add(key);
      return item;
    }
  });
};

/**
 * This function checks the all inventories and compares it to the manifest
 * if there are no existing inventories, it will return the inventory_id with a null value
 * indicating that a new inventory needs to be created
 *
 * @param data
 * @param existing_inventories
 * @returns UploadManifestInput[]
 */
export const formatExistingInventories = (
  data: UploadManifestInput[],
  existing_inventories: InventoryRow[],
): UploadManifestInput[] => {
  return data.map((item) => {
    if (!item.isValid) return item;

    /**
     * Find auction_inventory item in the inventories
     * SCENARIO A:
     * check if the auction inventory has a container barcode
     * check if container barcode already exists and is SOLD
     * if SOLD
     * - return error saying that item already exists and SOLD
     *
     * SCENARIO B:
     * check if auction inventory has a container barcode
     * if auction inventory has no container barcode, add control to condition
     * check if inventory with no container barcode but has control exists and is SOLD
     * if SOLD
     * - return error saying that item already exists and SOLD
     */
    const existing_inventory = existing_inventories.find((inventory) => {
      if (item.BARCODE.split("-").length === 3) {
        return inventory.barcode === item.BARCODE;
      }

      return (
        inventory.barcode === item.BARCODE && inventory.control === item.CONTROL
      );
    });

    if (existing_inventory)
      if (["SOLD"].includes(existing_inventory.status)) {
        item.isValid = false;
        item.error = "Item already exists and SOLD in inventories";
      } else {
        item.forUpdating = true;
        item.inventory_id = existing_inventory.inventory_id;
        item.container_id = existing_inventory.container_id;
      }

    return item;
  });
};

export const addContainerIdForNewInventories = (
  data: UploadManifestInput[],
  containers: ContainerWithAllRow[],
): UploadManifestInput[] => {
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
        container_barcode.barcode === item_container_barcode,
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

export const removeMonitoringDuplicates = (
  data: UploadManifestInput[],
  monitoring: AuctionInventoryWithDetailsRow[],
) => {
  const existing_monitoring = monitoring.map((item) =>
    JSON.stringify({
      BARCODE: item.inventory.barcode,
      CONTROL: item.inventory.control,
    }),
  );

  /**
   * If item already exists but have CANCELLED or REFUNDED status
   * update item to:
   * inventory status: SOLD
   * auction inventory status: UNPAID
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

      sheet_item.forUpdating = true;
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
