import * as xlsx from "xlsx-js-style";
// import { ContainerCommission } from "@types";

// container_id: number;
// name: string;
// barcode: string;
// sales_remittance_account: string;
// commission: string;
// due_date: any;
// monitoring: Monitoring[];

const generateMonthlyCommission = (
  // containers: ContainerCommission[],
  containers: any[],
  workbook: xlsx.WorkBook
) => {
  const sheet = xlsx.utils.aoa_to_sheet(
    Array.from({ length: 50 }, () => [...Array(10).fill(null)])
  );

  sheet["!autofilter"] = { ref: "A16:F16" };
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
    { s: { r: 24, c: 1 }, e: { r: 24, c: 3 } }, // B25:D25
  ];

  sheet["!rows"] = [{}, {}, {}, {}, { hpt: 50 }];
  sheet["!cols"] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];

  sheet["B1"] = {
    v: "ATC GROUP COMISSION",
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
    v: `本目コンテナ`,
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
    v: "5% COM",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, color: { rgb: "FF0000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: fullBorderStyle("thin"),
    },
  };

  sheet["F5"] = {
    v: "ATC GROUP ROYALTY",
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
    v: "",
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
    v: "",
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

  const formula = `SUM(${workbook.SheetNames.map((name) => `'${name}'!B1`).join(
    ", "
  )})`;

  sheet["C6"] = {
    f: formula,
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
    f: `SUM(F${17 + containers.length + 1})`,
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
    v: `0`,
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
    v: `0`,
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
    v: containers.map((item) => item.name).join(","),
    t: "s",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["A10"] = {
    v: "BARCODE",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B10"] = {
    v: `${containers.map((item) => item.barcode).join(",")}`,
    t: "s",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["A11"] = {
    v: "COMMISSION",
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
    v: "7111500",
    t: "s",
    s: { font: { name: "Arial", sz: 9 } },
  };

  sheet["A14"] = {
    v: "BANK ADDRESS",
    t: "s",
    s: { font: { name: "Arial", sz: 9, bold: true } },
  };

  sheet["B14"] = {
    v: "2-16-5 KONAN, MINAMI-KU,TOKYO,JAPAN",
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

  const commissionHeaders = [
    "CON #",
    "SUPPLIER/BARCODE",
    "SALES",
    "REMITTED",
    "ATC COM",
    "ATC GROUP 5% COM",
  ];

  const commissionTable = [
    ...containers.map((item, i) => [i + 1, `${item.name} ${item.barcode}`]),
  ];

  xlsx.utils.sheet_add_aoa(sheet, [commissionHeaders, ...commissionTable], {
    origin: { r: 15, c: 0 },
  });

  commissionHeaders.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({ r: 15, c: colIndex });
    if (!sheet[headerCell]) return;
    sheet[headerCell].s = {
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "5B9BD5" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };
  });

  commissionTable.forEach((_, rowIndex) => {
    [1, 2].forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: 16 + rowIndex,
        c: colIndex,
      });

      sheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: colIndex === 0 ? 12 : 11,
          bold: colIndex === 0,
          color: { rgb: colIndex === 0 ? "FF0000" : "000000" },
        },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          right: { style: "thin", color: { rgb: "000000" } },
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
        },
      };
    });
  });

  containers.forEach((item, i) => {
    let filename = `${item.name.toUpperCase()} ${item.barcode.toUpperCase()}`;
    if (filename.length > 30) {
      filename = filename.replace("CO.,LTD", "");
    }

    const containerIndex = workbook.SheetNames.findIndex(
      (sheetName) => sheetName === filename
    );

    sheet[`C${17 + i}`] = {
      f: `SUM('${workbook.SheetNames[containerIndex]}'!B1)`,
      t: "n",
      z: '"₱" #,##0.00',
      s: {
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          right: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };

    sheet[`E${17 + i}`] = {
      f: `IF(SUM(C${17 + i})<700000,
         SUM(C${17 + i})*0.25,
         IF(SUM(C${17 + i})<=799999,
            SUM(C${17 + i})*0.2,
            SUM(C${17 + i})*0.15
         )
       )`,
      t: "n",
      z: '"₱" #,##0.00',
      s: {
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };

    sheet[`F${17 + i}`] = {
      f: `E${17 + i} / 3`,
      t: "n",
      z: '"₱" #,##0.00',
      s: {
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };
  });

  sheet[`D${17 + containers.length + 1}`] = {
    v: "TOTAL",
    s: {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`E${17 + containers.length + 1}`] = {
    f: `SUM(E17:E${17 + containers.length})`,
    t: "n",
    z: '"₱"[Red]#,##0.00',
    s: {
      font: { name: "Calibri", sz: 11, color: "FF0000" },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`F${17 + containers.length + 1}`] = {
    f: `SUM(F17:F${17 + containers.length})`,
    t: "n",
    z: '"₱" #,##0.00',
    s: {
      font: { bold: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B25"] = {
    v: "ATC GROUP ROYALTY",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      fill: { fgColor: { rgb: "9BC2E6" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  const atcRoyaltyHeaders = ["SUPPLIERS/BARCODE", "AUCTION SALES", "ROYALTY"];
  const royaltyTableData = [
    ...containers
      .filter((item) => item.commission === "ATC")
      .map((item) => [`${item.name}, ${item.barcode}`]),
  ];

  xlsx.utils.sheet_add_aoa(sheet, [atcRoyaltyHeaders, ...royaltyTableData], {
    origin: { r: 25, c: 1 },
  });

  atcRoyaltyHeaders.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({ r: 25, c: colIndex + 1 });
    if (!sheet[headerCell]) return;
    sheet[headerCell].s = {
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "5B9BD5" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: fullBorderStyle("thin"),
    };
  });

  royaltyTableData.forEach((_, rowIndex) => {
    [2].forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: 26 + rowIndex,
        c: colIndex + 1,
      });

      sheet[cellAddress].s = {
        font: {
          name: "Calibri",
          sz: 11,
          color: { rgb: "000000" },
        },
        alignment: { horizontal: "center", vertical: "center" },
        border: fullBorderStyle("thin"),
      };
    });
  });

  containers
    .filter((item) => item.commission === "ATC")
    .forEach((item, i) => {
      let filename = `${item.name.toUpperCase()} ${item.barcode.toUpperCase()}`;
      if (filename.length > 30) {
        filename = filename.replace("CO.,LTD", "");
      }

      const containerIndex = workbook.SheetNames.findIndex(
        (sheetName) => sheetName === filename
      );

      sheet[`C${27 + i}`] = {
        f: `SUM('${workbook.SheetNames[containerIndex]}'!B1)`,
        t: "n",
        z: '"₱" #,##0.00',
        s: {
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: fullBorderStyle("thin"),
        },
      };

      sheet[`D${27 + i}`] = {
        f: `IF(C${27 + i}<450000, 20000,
              IF(C${27 + i}<500000, 22000,
                IF(C${27 + i}<550000, 25000,
                  IF(C${27 + i}<700000, 30000,
                    IF(C${27 + i}<800000, 32000, 35000)
                  )
                )
              )
            )`,
        t: "n",
        z: '"₱" #,##0.00',
        s: {
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: fullBorderStyle("thin"),
        },
      };
    });

  return sheet;
};

export default generateMonthlyCommission;
