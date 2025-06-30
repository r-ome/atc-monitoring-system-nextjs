import * as xlsx from "xlsx-js-style";
import { Monitoring } from "./generateReport";

const generateMonitoringReport = (monitoring: Monitoring[]) => {
  const tableHeader = [
    "BARCODE",
    "CONTROL",
    "DESCRIPTION",
    "BIDDER #",
    "QTY",
    "PRICE",
  ];

  const data = monitoring.map((item) => [
    item.barcode,
    item.control,
    item.description,
    item.bidder_number ? item.bidder_number : "",
    item.qty ? item.qty : "",
    item.price ? item.price : "",
  ]);

  const sheet = xlsx.utils.aoa_to_sheet([
    ["", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    tableHeader,
    ...data,
  ]);

  sheet["!autofilter"] = { ref: "A3:F3" };
  sheet["!cols"] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
  ];

  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // A1:A2
    { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // B1:B2
    { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // D1:D2
    { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } }, // E1:E2
    { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }, // F1:F2
  ];

  sheet["A1"] = {
    v: "TOTAL PRICE OF ITEMS:",
    t: "s",
    s: {
      font: { name: "Arial", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D3D3D3" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thick", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A2"] = {
    v: "",
    s: {
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thick", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B1"] = {
    f: `SUM(F4:F${data.length + 3})`,
    t: "n",
    z: "#,##0",
    s: {
      font: { name: "Arial", sz: 12, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B2"] = {
    v: "",
    s: {
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C1"] = {
    v: "HIGHEST PRICE:",
    s: {
      font: { name: "Arial", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D3D3D3" } },
      alignment: {
        horizontal: "right",
        vertical: "center",
      },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C2"] = {
    v: "MONITORING",
    s: {
      font: { name: "Arial", sz: 10, bold: true },
      fill: { fgColor: { rgb: "FFD700" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["D1"] = {
    f: `MAX(F3:F${data.length + 3})`,
    t: "n",
    z: "#,##0",
    s: {
      font: { bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["D2"] = {
    v: "",
    s: {
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["E1"] = {
    v: "NUMBER OF ITEMS",
    s: {
      font: { name: "Arial", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D3D3D3" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["E2"] = {
    v: "",
    s: {
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F1"] = {
    f: `COUNTA(A4:A${data.length ? data.length + 3 : "4"})`,
    t: "n",
    z: "#,##0",
    s: {
      font: { bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thick", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F2"] = {
    v: "",
    s: {
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  tableHeader.forEach((cell, colIndex) => {
    const cellAddress = xlsx.utils.encode_cell({ r: 2, c: colIndex });
    sheet[cellAddress].s = {
      font: { name: "Arial", sz: 10, bold: true, color: { rgb: "FFFFFF" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      fill: { fgColor: { rgb: "4F71BF" } },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };
  });

  data.forEach((rowData, rowIndex) => {
    rowData.forEach((cellData, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: rowIndex + 3,
        c: colIndex,
      });

      const borderStyles = {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
      };
      if (!sheet[cellAddress]) return;
      sheet[cellAddress].s = {
        font: { name: "Arial", sz: 10 },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true,
        },
        border: borderStyles,
      };

      if (colIndex === 5) {
        sheet[cellAddress] = {
          v: rowData[5],
          t: "n",
          z: "#,##0",
          s: {
            alignment: {
              horizontal: "right",
            },
            border: borderStyles,
          },
        };
      }
    });
  });

  return sheet;
};

export default generateMonitoringReport;
