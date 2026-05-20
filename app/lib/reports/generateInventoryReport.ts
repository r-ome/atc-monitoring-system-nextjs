import * as xlsx from "xlsx-js-style";

export type InternalInventoryReportRow = {
  barcode: string;
  control: string;
  description: string;
  bidder_number: string;
  qty: string;
  price: number;
  auction_date: string;
  status: string;
  reason?: string | null;
};

type InternalInventoryReportInput = {
  paid: InternalInventoryReportRow[];
  unpaid: InternalInventoryReportRow[];
  filename: string;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
};

const headerStyle = {
  font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
  alignment: { horizontal: "center", vertical: "center", wrapText: true },
  fill: { fgColor: { rgb: "4F71BF" } },
  border: {
    right: { style: "thin", color: { rgb: "000000" } },
    bottom: { style: "thin", color: { rgb: "000000" } },
  },
};

const dataBorder = {
  top: { style: "thin", color: { rgb: "000000" } },
  right: { style: "thin", color: { rgb: "000000" } },
  bottom: { style: "thin", color: { rgb: "000000" } },
  left: { style: "thin", color: { rgb: "000000" } },
};

const buildSheet = (
  rows: InternalInventoryReportRow[],
  type: "paid" | "unpaid",
) => {
  const includeStatus = type === "unpaid";
  const headers = [
    "BARCODE",
    "CONTROL",
    "DESCRIPTION",
    "BIDDER #",
    "QTY",
    "PRICE",
    "AUCTION DATE",
    ...(includeStatus ? ["STATUS", "REASON"] : []),
  ];
  const data = rows.map((item) => [
    item.barcode,
    item.control,
    item.description,
    item.bidder_number,
    item.qty,
    item.price,
    item.auction_date,
    ...(includeStatus
      ? [
          item.status,
          item.status === "CANCELLED" || item.status === "REFUNDED"
            ? item.reason ?? ""
            : "",
        ]
      : []),
  ]);
  const totalLabel =
    type === "paid" ? "TOTAL PAID SALES:" : "TOTAL UNPAID PRICE:";

  const sheet = xlsx.utils.aoa_to_sheet([
    [totalLabel, rows.length ? null : 0],
    [],
    headers,
    ...data,
  ]);

  sheet["!autofilter"] = {
    ref: `A3:${xlsx.utils.encode_col(headers.length - 1)}3`,
  };
  sheet["!cols"] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 40 },
    { wch: 14 },
    { wch: 10 },
    { wch: 14 },
    { wch: 18 },
    ...(includeStatus ? [{ wch: 16 }, { wch: 35 }] : []),
  ];

  sheet["A1"].s = {
    font: { name: "Arial", sz: 10, bold: true },
    fill: { fgColor: { rgb: "D9EAF7" } },
    alignment: { horizontal: "center", vertical: "center", wrapText: true },
    border: dataBorder,
  };

  if (rows.length) {
    sheet["B1"] = {
      f: `SUM(F4:F${rows.length + 3})`,
      t: "n",
      z: "#,##0",
      s: {
        font: { name: "Arial", sz: 12, bold: true },
        alignment: { horizontal: "right", vertical: "center" },
        border: dataBorder,
      },
    };
  } else {
    sheet["B1"].s = {
      font: { name: "Arial", sz: 12, bold: true },
      alignment: { horizontal: "right", vertical: "center" },
      border: dataBorder,
    };
  }

  headers.forEach((_, colIndex) => {
    const cellAddress = xlsx.utils.encode_cell({ r: 2, c: colIndex });
    if (sheet[cellAddress]) {
      sheet[cellAddress].s = headerStyle;
    }
  });

  data.forEach((rowData, rowIndex) => {
    rowData.forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: rowIndex + 3,
        c: colIndex,
      });

      if (!sheet[cellAddress]) return;

      sheet[cellAddress].s = {
        font: { name: "Arial", sz: 10 },
        alignment: {
          horizontal: colIndex === 2 || colIndex === 8 ? "left" : "center",
          vertical: "center",
          wrapText: true,
        },
        border: dataBorder,
      };

      if (colIndex === 5) {
        sheet[cellAddress] = {
          v: rowData[5],
          t: "n",
          z: "#,##0",
          s: {
            font: { name: "Arial", sz: 10 },
            alignment: { horizontal: "right", vertical: "center" },
            border: dataBorder,
          },
        };
      }
    });
  });

  return sheet;
};

const generateInventoryReport = ({
  paid,
  unpaid,
  filename,
}: InternalInventoryReportInput) => {
  const workbook = xlsx.utils.book_new();

  xlsx.utils.book_append_sheet(workbook, buildSheet(paid, "paid"), "PAID");
  xlsx.utils.book_append_sheet(workbook, buildSheet(unpaid, "unpaid"), "UNPAID");

  const excelBuffer = xlsx.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  downloadBlob(blob, filename);
  return blob;
};

export default generateInventoryReport;
