import * as xlsx from "xlsx-js-style";
import { UnsoldMonitoring } from "./generateUnsoldReport";

const generateInventoryList = (monitoring: UnsoldMonitoring[]) => {
  const headers = ["Barcode", "Description", "SOLD / UNSOLD"];
  const data = monitoring.map((item) => [
    item.barcode,
    item.description,
    item.status,
  ]);

  const sheet = xlsx.utils.aoa_to_sheet([headers, ...data, [null, null]]);
  sheet["!autofilter"] = { ref: "A1:C1" };
  sheet["!cols"] = [{ wch: 15 }, { wch: 40 }, { wch: 30 }];

  headers.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({ r: 0, c: colIndex });
    if (!sheet[headerCell]) return;
    sheet[headerCell].s = {
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "5B9BD5" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };
  });

  data.forEach((_, rowIndex) => {
    const style = {
      font: { name: "Calibri", sz: 11 },
      fill: { fgColor: { rgb: rowIndex % 2 === 0 ? "DDEBF7" : "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "9BC2E6" } },
        bottom: { style: "thin", color: { rgb: "9BC2E6" } },
        top: { style: "thin", color: { rgb: "9BC2E6" } },
      },
    };

    headers.forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: rowIndex + 1,
        c: colIndex,
      });

      if (sheet[cellAddress]) {
        sheet[cellAddress].s = style;
      }
    });
  });

  const lastRowIndex = data.length + 1;
  const formulaCell = `A${lastRowIndex + 1}`;

  sheet[formulaCell] = {
    t: "n",
    f: `SUBTOTAL(103, A2:A${lastRowIndex})`,
    s: {
      font: { name: "Calibri", sz: 11, bold: true },
      alignment: { horizontal: "right", vertical: "center" },
    },
  };

  return sheet;
};

export default generateInventoryList;
