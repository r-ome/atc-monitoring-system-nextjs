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
        .filter((item) => Object.values(item).some(Boolean))
        .filter((item) => !!item.BARCODE);
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

export type PayrollSheetRow = {
  rowIndex: number;
  name: string;
  newRate: number | null;
  daysCount: number | null;
  basicPay: number | null;
  otHour: number | null;
  otHourPay: number | null;
  otMin: number | null;
  otMinPay: number | null;
  auction: number | null;
  container: number | null;
  leaveWithPay: number | null;
  holiday: number | null;
  grossPay: number | null;
  philhealth: number | null;
  pagibig: number | null;
  sss: number | null;
  pagibigLoan: number | null;
  others: number | null;
  slc: number | null;
  late: number | null;
  undertime: number | null;
  netPay: number | null;
  daysWorkedRight: number | null;
  leaveDays: number | null;
};

const num = (v: unknown): number | null => {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const getPayrollRegularSheetData = (
  file: ArrayBuffer,
): { data: PayrollSheetRow[]; periodLabel: string } => {
  try {
    const workbook = xlsx.read(file, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new InputParseError("Empty workbook", {
        cause: { file: ["The uploaded workbook has no sheets."] },
      });
    }
    const ws = workbook.Sheets[firstSheetName];

    const periodLabelCell = ws["H2"]?.v;
    const periodLabel = typeof periodLabelCell === "string" ? periodLabelCell.trim() : "";

    const rows = xlsx.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      defval: "",
      raw: true,
      blankrows: true,
    }) as unknown[][];

    // Find the header row by content (NAME column in B). Search the first
    // ~20 rows so we tolerate extra leading blanks / banner rows.
    const required = ["NAME", "BASIC PAY", "GROSS PAY", "NET PAY"];
    const norm = (c: unknown) => String(c ?? "").trim().toUpperCase().replace(/\s+/g, " ");

    let headerRow = -1;
    for (let i = 0; i < Math.min(rows.length, 20); i++) {
      const row = (rows[i] ?? []).map(norm);
      if (row.includes("NAME") && row.includes("BASIC PAY")) {
        headerRow = i;
        break;
      }
    }
    if (headerRow === -1) {
      throw new InputParseError("Missing header row", {
        cause: {
          file: [
            `Could not find a header row with NAME and BASIC PAY columns. Expected columns: ${required.join(", ")}.`,
          ],
        },
      });
    }

    const header = (rows[headerRow] ?? []).map(norm);
    for (const r of required) {
      if (!header.some((h) => h === r)) {
        throw new InputParseError(`Missing column: ${r}`, {
          cause: { file: [`Expected column '${r}' in the sheet header.`] },
        });
      }
    }

    // Map column-name → column-index. Accepts a small set of aliases so we
    // tolerate small wording differences between actual files and the template.
    const ALIASES: Record<keyof PayrollSheetRow, string[]> = {
      rowIndex: [],
      name: ["NAME"],
      newRate: ["NEW RATE"],
      daysCount: ["NO. OF DAYS"], // first occurrence (column D in the template)
      basicPay: ["BASIC PAY"],
      otHour: ["OT HOUR", "OT HOURS"],
      otHourPay: ["O.T. PAY", "OT PAY (HOURS)", "OT HOUR PAY"],
      otMin: ["OT PER MINUTE", "OT MINUTES"],
      otMinPay: ["OT PAY", "OT MINUTE PAY", "OT PAY (MINUTES)"],
      auction: ["AUCTION"],
      container: ["CONTAINER"],
      leaveWithPay: ["LEAVE WITH PAY", "LEAVE W/ PAY", "LEAVE W/PAY"],
      holiday: ["HOLIDAY"],
      grossPay: ["GROSS PAY"],
      philhealth: ["PHILHEALTH", "PHIL HEALTH"],
      pagibig: ["PAG IBIG", "PAGIBIG", "PAG-IBIG"],
      sss: ["SSS"],
      pagibigLoan: ["PAG IBIG LOAN", "PAGIBIG LOAN", "PAG-IBIG LOAN"],
      others: ["OTHERS", "OTHER"],
      slc: ["SLC"],
      late: ["LATE", "LATES"],
      undertime: ["UNDERTIME"],
      netPay: ["NET PAY"],
      daysWorkedRight: [], // second NO. OF DAYS — resolved below
      leaveDays: ["NO. OF LEAVE W/PAY", "NO. OF LEAVE WITH PAY", "LEAVE W/PAY DAYS"],
    };

    const findIndex = (labels: string[], occurrence = 0): number => {
      let seen = -1;
      for (let i = 0; i < header.length; i++) {
        if (labels.includes(header[i])) {
          seen++;
          if (seen === occurrence) return i;
        }
      }
      return -1;
    };

    const idx: Record<keyof PayrollSheetRow, number> = {} as Record<
      keyof PayrollSheetRow,
      number
    >;
    for (const key of Object.keys(ALIASES) as (keyof PayrollSheetRow)[]) {
      if (!ALIASES[key].length) continue;
      idx[key] = findIndex(ALIASES[key], 0);
    }
    // The two "NO. OF DAYS" columns: the first is the actual days-worked input,
    // the second (rightmost) is the count used for summary. We map the first
    // to `daysCount` (already resolved via ALIASES) and the second to
    // `daysWorkedRight`.
    idx.daysWorkedRight = findIndex(["NO. OF DAYS"], 1);

    const cellNum = (r: unknown[], key: keyof PayrollSheetRow): number | null => {
      const i = idx[key];
      if (i == null || i < 0) return null;
      return num(r[i]);
    };
    const cellStr = (r: unknown[], key: keyof PayrollSheetRow): string => {
      const i = idx[key];
      if (i == null || i < 0) return "";
      return String(r[i] ?? "").trim();
    };

    const FOOTER_PATTERNS = [/^PREPARED\s*BY/i, /^TOTAL/i, /^GRAND\s*TOTAL/i, /^NOTED\s*BY/i, /^CHECKED\s*BY/i];

    const data: PayrollSheetRow[] = [];
    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i] ?? [];
      const name = cellStr(r, "name");
      if (!name) continue;
      if (FOOTER_PATTERNS.some((p) => p.test(name))) break;
      data.push({
        rowIndex: i + 1,
        name,
        newRate: cellNum(r, "newRate"),
        daysCount: cellNum(r, "daysCount"),
        basicPay: cellNum(r, "basicPay"),
        otHour: cellNum(r, "otHour"),
        otHourPay: cellNum(r, "otHourPay"),
        otMin: cellNum(r, "otMin"),
        otMinPay: cellNum(r, "otMinPay"),
        auction: cellNum(r, "auction"),
        container: cellNum(r, "container"),
        leaveWithPay: cellNum(r, "leaveWithPay"),
        holiday: cellNum(r, "holiday"),
        grossPay: cellNum(r, "grossPay"),
        philhealth: cellNum(r, "philhealth"),
        pagibig: cellNum(r, "pagibig"),
        sss: cellNum(r, "sss"),
        pagibigLoan: cellNum(r, "pagibigLoan"),
        others: cellNum(r, "others"),
        slc: cellNum(r, "slc"),
        late: cellNum(r, "late"),
        undertime: cellNum(r, "undertime"),
        netPay: cellNum(r, "netPay"),
        daysWorkedRight: cellNum(r, "daysWorkedRight"),
        leaveDays: cellNum(r, "leaveDays"),
      });
    }

    return { data, periodLabel };
  } catch (error) {
    if (error instanceof InputParseError) throw error;
    logger("getPayrollRegularSheetData", error);
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
