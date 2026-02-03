import * as xlsx from "xlsx-js-style";
import { formatDate } from "@/app/lib/utils";
import { Container } from "src/entities/models/Container";

type ContainerWithSupplierRemittanceAccount = Omit<Container, "supplier"> & {
  supplier: {
    supplier_id: string;
    name: string;
    sales_remittance_account: string;
  };
};

const generateFinalComputation = (
  container: ContainerWithSupplierRemittanceAccount,
  workbook: xlsx.WorkBook,
) => {
  const sheet = xlsx.utils.aoa_to_sheet(
    Array.from({ length: 50 }, () => [...Array(10).fill(null)]),
  );

  const remittanceAccount = container.supplier.sales_remittance_account
    .toUpperCase()
    .includes("ECORE")
    ? "MILLENIUM"
    : "ATC";

  sheet["!merges"] = [
    { s: { r: 0, c: 1 }, e: { r: 0, c: 3 } }, // B1:D1
    { s: { r: 3, c: 3 }, e: { r: 3, c: 6 } }, // D4:G4
    { s: { r: 7, c: 1 }, e: { r: 7, c: 2 } }, // B8:C8
    { s: { r: 8, c: 1 }, e: { r: 8, c: 2 } }, // B9:C9
    { s: { r: 9, c: 1 }, e: { r: 9, c: 2 } }, // B10:C10
    { s: { r: 10, c: 1 }, e: { r: 10, c: 2 } }, // B11:C11
    { s: { r: 11, c: 1 }, e: { r: 11, c: 2 } }, // B12:C12
    { s: { r: 12, c: 1 }, e: { r: 12, c: 2 } }, // B13:C13
    { s: { r: 13, c: 1 }, e: { r: 13, c: 2 } }, // B14:C14
    { s: { r: 8, c: 3 }, e: { r: 13, c: 3 } }, // D9:D14
    { s: { r: 8, c: 4 }, e: { r: 13, c: 4 } }, // E9:E14
    { s: { r: 7, c: 5 }, e: { r: 7, c: 7 } }, // F8:H8
    { s: { r: 8, c: 5 }, e: { r: 9, c: 7 } }, // F9:H10
    { s: { r: 10, c: 6 }, e: { r: 10, c: 7 } }, // G11:H11
    { s: { r: 11, c: 6 }, e: { r: 11, c: 7 } }, // G12:H12
    { s: { r: 12, c: 5 }, e: { r: 13, c: 5 } }, // F13:F14
    { s: { r: 12, c: 6 }, e: { r: 13, c: 7 } }, // G13:H14
    { s: { r: 3, c: 0 }, e: { r: 4, c: 0 } }, // A4:A5
    { s: { r: 3, c: 1 }, e: { r: 4, c: 1 } }, // B4:B5
    { s: { r: 3, c: 2 }, e: { r: 4, c: 2 } }, // C4:C5
    { s: { r: 3, c: 7 }, e: { r: 4, c: 7 } }, // H4:H5
  ];

  sheet["!rows"] = [{}, {}, {}, {}, { hpt: 50 }];
  sheet["!cols"] = [
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

  sheet["B1"] = {
    v: container.supplier.name.toUpperCase(),
    t: "s",
    s: {
      font: { name: "Arial", sz: 10, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  sheet["A3"] = {
    v: `${container.barcode.split("-")[1]} 本目コンテナ`,
    t: "s",
    s: { font: { name: "Calibri", sz: 14 } },
  };

  sheet["H3"] = {
    v: "単位ペソ",
    t: "s",
    s: { font: { name: "Calibri", sz: 12 } },
  };

  const topBorderStyle = ["A", "B", "C", "D", "E", "F", "G", "H"];

  topBorderStyle.forEach((col) => {
    sheet[`${col}4`] = {
      v: "",
      s: {
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };
  });

  const fullBorderStyle = (size: "thin" | "medium") => ({
    top: { style: size, color: { rgb: "000000" } },
    right: { style: size, color: { rgb: "000000" } },
    left: { style: size, color: { rgb: "000000" } },
    bottom: { style: size, color: { rgb: "000000" } },
  });

  sheet["D4"] = {
    v: "控 徐 明 細",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: { ...sheet["D4"].s.border },
    },
  };

  sheet["D5"] = {
    v: "輸入諸費用",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: fullBorderStyle("thin"),
    },
  };

  sheet["E5"] = {
    v: "EXTRA CHARGE",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: fullBorderStyle("thin"),
    },
  };

  sheet["F5"] = {
    v: "販売手数料15%",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: fullBorderStyle("thin"),
    },
  };

  sheet["G5"] = {
    v: "仕分け費用",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: fullBorderStyle("thin"),
    },
  };

  sheet["H4"] = {
    v: "支払い金額",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["H5"] = {
    v: "",
    t: "s",
    s: { border: fullBorderStyle("thin") },
  };

  sheet["A4"] = {
    v: "入荷日",
    t: "s",
    s: {
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A5"] = {
    v: "",
    t: "s",
    s: { border: fullBorderStyle("thin") },
  };

  sheet["A6"] = {
    v: container.arrival_date
      ? formatDate(new Date(container.arrival_date), "MM/dd/yy")
      : "",
    t: "s",
    s: {
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B4"] = {
    v: "支払予定日",
    t: "s",
    s: {
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B5"] = {
    v: "",
    t: "s",
    s: { border: fullBorderStyle("thin") },
  };

  sheet["B6"] = {
    v: container.due_date
      ? formatDate(new Date(container.due_date), "MM/dd/yy")
      : "",
    t: "s",
    s: {
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C4"] = {
    v: "支払予定日",
    t: "s",
    s: {
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C5"] = {
    v: "",
    t: "s",
    s: { border: fullBorderStyle("thin") },
  };

  sheet["C6"] = {
    f: `'${workbook.SheetNames[0]}'!B1`,
    t: "n",
    z: "#,##0",
    s: {
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["D6"] = {
    v: "0",
    t: "n",
    z: "#,##0",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["E6"] = {
    v: "0",
    t: "n",
    z: "#,##0",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F6"] = {
    f: `C6*0.15`,
    t: "n",
    z: "#,##0",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G6"] = {
    f: `C6*0.05`,
    t: "n",
    z: "#,##0",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["H6"] = {
    f: `C6-D6-E6-F6-G6`,
    t: "n",
    z: "#,##0",
    s: {
      font: { name: "Calibri", sz: 14 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A8"] = {
    v: "SENDER",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B8"] = {
    v: "ATC JAPAN AUCTION PRODUCT TRADING",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["D8"] = {
    v: "CHARGES",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["E8"] = {
    v: "TOTAL CHARGE",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["F8"] = {
    v: "TOTAL  TO BE TRANSFER THRU BANK",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["A9"] = {
    v: "SUPPLIER",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B9"] = {
    v: container.supplier.name,
    t: "s",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["A10"] = {
    v: "BARCODE",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B10"] = {
    v: container.barcode,
    t: "s",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["A11"] = {
    v: "NET SALES",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B11"] = {
    f: "H6",
    t: "n",
    z: "#,##0",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["A12"] = {
    v: "BANK RECEIVER",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B12"] = {
    v: "ATCGROUP,LLC",
    t: "s",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["A13"] = {
    v: "BANK ACCOUNT",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B13"] = {
    v: remittanceAccount === "MILLENIUM" ? "547-11819088" : "7111500",
    t: "s",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["A14"] = {
    v: "BANK ADDRESS",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B14"] = {
    v:
      remittanceAccount === "MILLENIUM"
        ? "25-1 Matsugae Cho, Minami-ku, Sagamihara-shi, Kanagawa-ken, 252-0313, Japan"
        : "2-16-5 KONAN, MINAMI-KU,TOKYO,JAPAN",
    t: "s",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["D9"] = {
    v: 1.2 / 100,
    t: "n",
    z: "0.0%",
    s: { font: { name: "Calibri", sz: 11 } },
  };

  sheet["E9"] = {
    f: "B11*D9",
    t: "n",
    z: `"Php"#,##0.00`,
    s: { font: { name: "Calibri", sz: 11, color: { rgb: "FF0000" } } },
  };

  sheet["F9"] = {
    f: "B11-E9",
    t: "n",
    z: "#,##0.00",
    s: { font: { name: "Calibri", sz: 14, bold: true } },
  };

  sheet["F11"] = {
    v: "JPY RATE",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
    },
  };

  sheet["F12"] = {
    v: "割合",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
    },
  };

  sheet["G11"] = {
    v: "TOTAL IN YEN",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
    },
  };

  sheet["G12"] = {
    v: "合計円",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
    },
  };

  sheet["F13"] = {
    v: 0.3925,
    t: "n",
    s: { font: { name: "Calibri", sz: 14, bold: true } },
  };

  sheet["G13"] = {
    f: "F9/$F$13",
    t: "n",
    z: `#,##0.00`,
    s: {
      font: { name: "Calibri", sz: 14, bold: true, color: { rgb: "FF0000" } },
    },
  };

  // Add borders to the range A8:H14 without overriding existing styles
  for (let row = 8; row <= 14; row++) {
    for (let col = 1; col <= 8; col++) {
      const cellAddress = xlsx.utils.encode_cell({ r: row - 1, c: col - 1 });
      if (!sheet[cellAddress]) sheet[cellAddress] = { v: "", t: "s" };

      // Merge the new border style with the existing cell style
      sheet[cellAddress].s = {
        ...sheet[cellAddress].s, // Preserve the existing styles
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: fullBorderStyle("medium"), // Add borders
      };
    }
  }

  sheet["A17"] = { v: "備考" };
  sheet["A18"] = { v: "日本円送金の場合、送金手数料１.2％がかかります。" };
  sheet["A20"] = {
    v: "0000と0000のナンバーは、オークション不成立の為ATC  JAPAN AUCTION の買取分です",
    s: {
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
    },
  };

  sheet["A23"] = { v: "佐々木 アイリン" };
  sheet["A26"] = {
    v: "売り上げレポート 用語説明",
    s: { font: { bold: true } },
  };

  const startRow = 27;

  const itemDescriptions = [
    ["表記", "英文説明", "日本語説明"],
    [
      "ASIS(ASI)",
      "DAMAGE",
      "ダメージ品、壊れている物、汚れている物、イミテーションなど ",
    ],
    ["ASSTD", "ASSORTED", "盛り合わせ品"],
    ["CONDEMN", "JUNK", "ジャンク品"],
    ["DI", "DISPLAY ITEMS", "デイスプレイ商品(展示できる目玉商品)"],
    ["CG", "CLOTHES & GARMENTS", "古着  洋服、生地物"],
    ["PW", "PLASTICWARE", "プラスチック製品"],
    ["CW", "COOKINGWARE", "鍋、釜、フライパンなど "],
    ["KW", "KITCHEN WARE", "食器類、瀬戸物"],
    ["EI", "ELECTRONIC ITEMS", "電化製品"],
    ["GW", "GLASSWARE", "グラス製品 "],
    ["WI", "WOOD ITEMS", "木製品 "],
  ];

  itemDescriptions.forEach((row, index) => {
    const rowIndex = startRow + index;
    const style =
      index === 0
        ? {
            fill: { fgColor: { rgb: "2F75B5" } },
            font: { bold: true, color: { rgb: "FFFFFF" } },
            alignment: { horizontal: "center", vertical: "center" },
          }
        : {};

    ["A", "B", "C"].forEach((col, i) => {
      sheet[`${col}${rowIndex}`] = {
        v: row[i],
        t: "s",
        s: { border: fullBorderStyle("thin"), ...style },
      };
    });
  });
  return sheet;
};

export default generateFinalComputation;
