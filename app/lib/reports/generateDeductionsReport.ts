import * as xlsx from "xlsx-js-style";
import { DeductionItem } from "./generateReport";

const generateDeductionsReport = (items: DeductionItem[]) => {
  const tableHeader = [
    "CONTROL",
    "DESCRIPTION",
    "BIDDER #",
    "ORIGINAL PRICE",
    "DEDUCTED AMOUNT",
  ];

  const data = items.map((item) => [
    item.control,
    item.description,
    item.bidder_number,
    item.original_price,
    item.deducted_amount,
  ]);

  const totalRow = [
    "",
    "",
    "TOTAL DEDUCTED",
    "",
    { f: `SUM(E2:E${data.length + 1})`, t: "n", z: "#,##0" },
  ];

  const sheet = xlsx.utils.aoa_to_sheet([tableHeader, ...data, totalRow]);

  sheet["!cols"] = [
    { wch: 20 },
    { wch: 35 },
    { wch: 12 },
    { wch: 18 },
    { wch: 18 },
  ];

  // Header row style
  tableHeader.forEach((_, colIndex) => {
    const cellAddress = xlsx.utils.encode_cell({ r: 0, c: colIndex });
    if (!sheet[cellAddress]) return;
    sheet[cellAddress].s = {
      font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "4F71BF" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    };
  });

  const borderStyles = {
    top: { style: "thin", color: { rgb: "000000" } },
    right: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
    left: { style: "thin", color: { rgb: "000000" } },
  };

  // Data rows
  data.forEach((rowData, rowIndex) => {
    const fillColor = rowIndex % 2 === 0 ? "DDEBF7" : "FFFFFF";
    rowData.forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({ r: rowIndex + 1, c: colIndex });
      if (!sheet[cellAddress]) return;

      const isNumeric = colIndex === 3 || colIndex === 4;
      if (isNumeric) {
        sheet[cellAddress] = {
          v: rowData[colIndex] as number,
          t: "n",
          z: "#,##0",
          s: {
            font: { name: "Arial", sz: 10 },
            fill: { fgColor: { rgb: fillColor } },
            alignment: { horizontal: "right", vertical: "center" },
            border: borderStyles,
          },
        };
      } else {
        sheet[cellAddress].s = {
          font: { name: "Arial", sz: 10 },
          fill: { fgColor: { rgb: fillColor } },
          alignment: { horizontal: "center", vertical: "center", wrapText: true },
          border: borderStyles,
        };
      }
    });
  });

  // Total row style
  const totalRowIndex = data.length + 1;
  const totalLabelCell = xlsx.utils.encode_cell({ r: totalRowIndex, c: 2 });
  const totalValueCell = xlsx.utils.encode_cell({ r: totalRowIndex, c: 4 });

  if (sheet[totalLabelCell]) {
    sheet[totalLabelCell].s = {
      font: { name: "Arial", sz: 10, bold: true },
      fill: { fgColor: { rgb: "FFD700" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: borderStyles,
    };
  }

  if (sheet[totalValueCell]) {
    sheet[totalValueCell].s = {
      font: { name: "Arial", sz: 10, bold: true },
      fill: { fgColor: { rgb: "FFD700" } },
      alignment: { horizontal: "right", vertical: "center" },
      border: borderStyles,
    };
  }

  // Style empty cells in total row
  [0, 1, 3].forEach((colIndex) => {
    const cellAddress = xlsx.utils.encode_cell({ r: totalRowIndex, c: colIndex });
    if (!sheet[cellAddress]) {
      sheet[cellAddress] = { v: "", t: "s" };
    }
    sheet[cellAddress].s = {
      fill: { fgColor: { rgb: "FFD700" } },
      border: borderStyles,
    };
  });

  return sheet;
};

export default generateDeductionsReport;
