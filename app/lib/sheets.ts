import * as xlsx from "xlsx";
import { InventorySheetRecord } from "src/entities/models/Inventory";
import { InputParseError } from "src/entities/errors/common";
import { logger } from "./logger";
import { formatNumberPadding } from "./utils";

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
  type: "bought_items" | "bidders" | "manifest" | "counter_check",
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

export const getInventorySheetData = (
  file: ArrayBuffer,
): { data: InventorySheetRecord[]; headers: string[] } => {
  try {
    const workbook = xlsx.read(file, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw = xlsx.utils.sheet_to_json(worksheet, {
      defval: "",
      raw: true,
    }) as Record<string, string>[];

    const headers = raw.length ? Object.keys(raw[0]) : [];

    const data = raw
      .filter((item) => item.Barcode)
      .map((item) => ({
        BARCODE: item.Barcode,
        CONTROL: item.Control !== "" ? item.Control.toString() : "",
        DESCRIPTION: item.Description,
      }))
      // The inventory template has a Total row at the end — exclude it
      .slice(0, -1);

    return { data, headers };
  } catch (error) {
    logger("getInventorySheetData", error);
    throw new InputParseError("Invalid Data!", {
      cause: { file: ["Sheet uploaded has wrong format!"] },
    });
  }
};
