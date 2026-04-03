import * as xlsx from "xlsx-js-style";
import { ExpenseSummaryEntry } from "src/entities/models/Report";

const headers = ["Date", "Purpose", "Remarks", "Amount"];

export default function generateExpensesSummary(data: ExpenseSummaryEntry[]) {
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const rows = data.map((item) => [
    item.created_at,
    item.purpose,
    item.remarks,
    item.amount,
  ]);

  const sheet = xlsx.utils.aoa_to_sheet([
    ["Expenses Summary"],
    [`Rows: ${data.length}`, "", "Total Amount", totalAmount],
    headers,
    ...rows,
  ]);

  sheet["!cols"] = [
    { wch: 24 },
    { wch: 18 },
    { wch: 48 },
    { wch: 18 },
  ];

  const titleCell = xlsx.utils.encode_cell({ r: 0, c: 0 });
  sheet[titleCell].s = {
    font: { bold: true, sz: 16 },
  };

  const totalsLabelCell = xlsx.utils.encode_cell({ r: 1, c: 2 });
  const totalsValueCell = xlsx.utils.encode_cell({ r: 1, c: 3 });
  sheet[totalsLabelCell].s = {
    font: { bold: true },
    alignment: { horizontal: "right" },
  };
  sheet[totalsValueCell].s = {
    font: { bold: true },
    alignment: { horizontal: "right" },
    numFmt: `"P"#,##0.00`,
  };

  headers.forEach((_, colIndex) => {
    const cellAddress = xlsx.utils.encode_cell({ r: 2, c: colIndex });
    sheet[cellAddress].s = {
      font: { bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1F4E78" } },
      alignment: { horizontal: "center" },
    };
  });

  data.forEach((item, rowIndex) => {
    const amountCellAddress = xlsx.utils.encode_cell({ r: rowIndex + 3, c: 3 });
    sheet[amountCellAddress].s = {
      alignment: { horizontal: "right" },
      numFmt: `"P"#,##0.00`,
      font: item.amount > 0 ? { color: { rgb: "C00000" } } : undefined,
    };
  });

  sheet["!autofilter"] = {
    ref: xlsx.utils.encode_range({
      s: { r: 2, c: 0 },
      e: { r: Math.max(data.length + 2, 2), c: headers.length - 1 },
    }),
  };

  sheet["!ref"] = xlsx.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(data.length + 2, 3), c: headers.length - 1 },
  });
  return sheet;
}
