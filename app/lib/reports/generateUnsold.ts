import * as xlsx from "xlsx-js-style";
import type { FinalReportInventoryRow } from "src/entities/models/FinalReport";

const generateUnsold = (
  unsoldItems: FinalReportInventoryRow[],
  barcode: string,
) => {
  const headers = ["Barcode", "Control", "Description"];
  const data = unsoldItems.map((item) => [
    item.barcode,
    item.control,
    item.description,
  ]);

  const filename = `${barcode} unsold`;

  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.aoa_to_sheet([
    ["UNSOLD", null, null],
    [null, null, null],
    headers,
    ...data,
    Array(headers.length).fill(null),
  ]);
  sheet["!autofilter"] = { ref: "A3:C3" };
  sheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 40 }];
  sheet["!merges"] = [{ s: { r: 0, c: 0 }, e: { r: 1, c: headers.length - 1 } }];
  sheet["!rows"] = [{ hpt: 24 }, { hpt: 24 }];

  const titleCell = xlsx.utils.encode_cell({ r: 0, c: 0 });
  if (sheet[titleCell]) {
    sheet[titleCell].s = {
      font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "2E75B6" } },
      alignment: { horizontal: "center", vertical: "center" },
    };
  }

  headers.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({ r: 2, c: colIndex });
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
        r: rowIndex + 3,
        c: colIndex,
      });

      if (sheet[cellAddress]) {
        sheet[cellAddress].s = style;
      }
    });
  });

  const lastRowIndex = data.length + 3;
  const formulaCell = `A${lastRowIndex + 1}`;

  sheet[formulaCell] = {
    t: "n",
    f: `SUBTOTAL(103, A4:A${lastRowIndex})`,
    s: {
      font: { name: "Calibri", sz: 11, bold: true },
      alignment: { horizontal: "right", vertical: "center" },
    },
  };

  xlsx.utils.book_append_sheet(workbook, sheet, "UNSOLD");

  const excelBuffer = xlsx.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default generateUnsold;
