import * as xlsx from "xlsx-js-style";
import { formatNumberPadding } from "@/app/lib/utils";

const generateEmptyInventoryList = (barcode: string) => {
  const headers = ["BARCODE", "CONTROL", "DESCRIPTION"];

  // sample data generator
  const descriptions = [
    "ASIS(ASI)",
    "ASSTD",
    "CONDEMN",
    "DI",
    "CG",
    "PW",
    "CW",
    "KW",
    "EI",
    "GW",
    "WI",
  ];

  const data = Array.from({ length: 999 }, (_, i) => [
    `${barcode}-${formatNumberPadding(i + 1, 3)}`,
    // "",
    formatNumberPadding(i + 5, 4),
    descriptions[Math.floor(Math.random() * descriptions.length)],
  ]);

  const filename = `${barcode} inventories`;

  const workbook = xlsx.utils.book_new();
  const sheet = xlsx.utils.aoa_to_sheet([headers, ...data]);
  sheet["!autofilter"] = { ref: "A1:C1" };
  sheet["!cols"] = [{ wch: 15 }, { wch: 30 }, { wch: 30 }];

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

  xlsx.utils.book_append_sheet(workbook, sheet, filename);

  const excelBuffer = xlsx.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheet.sheet",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);

  // return sheet;
};

export default generateEmptyInventoryList;
