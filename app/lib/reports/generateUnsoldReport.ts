import * as xlsx from "xlsx-js-style";
import { Monitoring } from "./generateReport";
import { InventoryStatus } from "src/entities/models/Inventory";

export type UnsoldMonitoring = Monitoring & {
  status: InventoryStatus;
};

const generateUnsoldReport = (
  monitoring: UnsoldMonitoring[],
  sheetDetails: {
    supplier: { name: string };
    barcode: string;
  }
) => {
  const headers = ["BARCODE", "CONTROL", "DESCRIPTION"];
  const totalSale = monitoring
    .filter((item) => item.status === "SOLD" && item.price)
    .reduce((acc, item) => acc + item.price, 0);
  const data = monitoring
    .filter((item) => item.status === "UNSOLD" || !item.price)
    .map((item) => [
      item.barcode,
      item.control,
      item.description,
      ...Array(3).fill(null),
    ]);

  const sheet = xlsx.utils.aoa_to_sheet([
    Array(10).fill(null),
    Array(10).fill(null),
    headers,
    ...data,
    ...Array.from({ length: 50 }, () => [...Array(10).fill(null)]),
  ]);

  sheet["!autofilter"] = { ref: "A3:C3" };
  sheet["!cols"] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 30 },
    { wch: 5 },
    { wch: 30 },
    { wch: 30 },
  ];
  sheet["!rows"] = [{ hpt: 40 }, { hpt: 40 }];
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // A1:F1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 2 } }, // A2:C2
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, // E4:F4
    { s: { r: 4, c: 4 }, e: { r: 7, c: 5 } }, // E5:F8
    { s: { r: 9, c: 4 }, e: { r: 9, c: 5 } }, // E10:F10
    { s: { r: 10, c: 4 }, e: { r: 13, c: 5 } }, // E11:F14
    { s: { r: 15, c: 4 }, e: { r: 15, c: 5 } }, // E16:F16
    { s: { r: 16, c: 4 }, e: { r: 19, c: 5 } }, // E17:F20
  ];

  sheet["A1"] = {
    v: sheetDetails.supplier.name.toUpperCase(),
    t: "s",
    s: {
      font: { name: "Calibri", sz: 22, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    },
  };

  sheet["A2"] = {
    v: sheetDetails.barcode.toUpperCase(),
    t: "s",
    s: {
      font: { name: "Calibri", sz: 18, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
    },
  };

  sheet["E4"] = {
    v: "UNSOLD ITEMS",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F4"] = {
    v: "",
    t: "s",
    s: {
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["E5"] = {
    v: data.length,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 48, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  ["E6", "E7", "E8", "F5", "F6", "F7", "F8"].forEach((cell) => {
    sheet[cell] = {
      v: "",
      t: "s",
      s: {
        border: {
          right: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };
  });

  sheet["E10"] = {
    v: "SOLD ITEMS",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "000000" } },
      fill: { fgColor: { rgb: "FFFF00" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F10"] = {
    v: "",
    t: "s",
    s: {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["E11"] = {
    v: monitoring.filter((item) => item.status === "SOLD").length,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 48, bold: true, color: { rgb: "000000" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  ["E12", "E13", "E14", "F11", "F12", "F13", "F14"].forEach((cell) => {
    sheet[cell] = {
      v: "",
      t: "s",
      s: {
        border: {
          right: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };
  });

  sheet["E16"] = {
    v: "TOTAL SALE",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 18, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "00B0F0" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F16"] = {
    v: "",
    t: "s",
    s: {
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["E17"] = {
    v: `PHP ${totalSale.toLocaleString()}`,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 48, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  ["E18", "E19", "E20", "F17", "F18", "F19", "F20"].forEach((cell) => {
    sheet[cell] = {
      v: "",
      t: "s",
      s: {
        border: {
          right: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };
  });

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

  return sheet;
};

export default generateUnsoldReport;
