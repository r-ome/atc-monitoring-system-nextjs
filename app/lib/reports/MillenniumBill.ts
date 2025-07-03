import * as xlsx from "xlsx-js-style";
import { formatDate } from "@/app/lib/utils";

type SheetDetails = {
  barcode: string;
  supplier: { name: string };
  arrival_date: string;
  bill_of_lading_number: string;
};

const MillenniumBill = (
  sheetDetails: SheetDetails,
  workbook: xlsx.WorkBook
) => {
  const sheet = xlsx.utils.aoa_to_sheet([
    ...Array.from({ length: 50 }, () => [...Array(8).fill(null)]),
  ]);

  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }, // A1:H1
    { s: { r: 1, c: 6 }, e: { r: 1, c: 7 } }, // G2:H2
    { s: { r: 3, c: 0 }, e: { r: 3, c: 4 } }, // A4:E4
    { s: { r: 5, c: 5 }, e: { r: 5, c: 7 } }, // F6:H6
    { s: { r: 6, c: 5 }, e: { r: 6, c: 7 } }, // F7:H7
    { s: { r: 7, c: 5 }, e: { r: 7, c: 7 } }, // F8:H8
    { s: { r: 8, c: 5 }, e: { r: 8, c: 7 } }, // F9:H9
    { s: { r: 8, c: 0 }, e: { r: 10, c: 0 } }, // A9:A11
    { s: { r: 8, c: 1 }, e: { r: 10, c: 3 } }, // B9:D11
    { s: { r: 11, c: 5 }, e: { r: 12, c: 7 } }, // F12:H13
    { s: { r: 13, c: 6 }, e: { r: 13, c: 7 } }, // G14:H14
    { s: { r: 14, c: 6 }, e: { r: 14, c: 7 } }, // G15:H15
    { s: { r: 15, c: 5 }, e: { r: 16, c: 5 } }, // F16:F17
    { s: { r: 15, c: 6 }, e: { r: 15, c: 7 } }, // G16:H16
    { s: { r: 16, c: 6 }, e: { r: 16, c: 7 } }, // G17:H17
    { s: { r: 17, c: 6 }, e: { r: 17, c: 7 } }, // G18:H18
    { s: { r: 18, c: 6 }, e: { r: 18, c: 7 } }, // G19:H19
    { s: { r: 19, c: 6 }, e: { r: 19, c: 7 } }, // G20:H20
    { s: { r: 21, c: 0 }, e: { r: 21, c: 5 } }, // A22:F22
    { s: { r: 21, c: 6 }, e: { r: 21, c: 7 } }, // G22:H22
    { s: { r: 22, c: 0 }, e: { r: 23, c: 5 } }, // A23:F24
    { s: { r: 22, c: 6 }, e: { r: 23, c: 7 } }, // G23:H24
    { s: { r: 24, c: 0 }, e: { r: 24, c: 5 } }, // A25:F25
    { s: { r: 25, c: 0 }, e: { r: 25, c: 5 } }, // A26:F26
    { s: { r: 26, c: 0 }, e: { r: 26, c: 5 } }, // A27:F27
    { s: { r: 27, c: 0 }, e: { r: 27, c: 5 } }, // A28:F28
    { s: { r: 28, c: 0 }, e: { r: 28, c: 5 } }, // A29:F29
    { s: { r: 29, c: 0 }, e: { r: 29, c: 5 } }, // A30:F30
    { s: { r: 30, c: 0 }, e: { r: 30, c: 5 } }, // A31:F31
    { s: { r: 24, c: 6 }, e: { r: 24, c: 7 } }, // G25:H25
    { s: { r: 25, c: 6 }, e: { r: 25, c: 7 } }, // G26:H26
    { s: { r: 26, c: 6 }, e: { r: 26, c: 7 } }, // G27:H27
    { s: { r: 27, c: 6 }, e: { r: 27, c: 7 } }, // G28:H28
    { s: { r: 28, c: 6 }, e: { r: 28, c: 7 } }, // G29:H29
    { s: { r: 29, c: 6 }, e: { r: 29, c: 7 } }, // G30:H30
    { s: { r: 30, c: 6 }, e: { r: 30, c: 7 } }, // G31:H31
  ];
  sheet["!rows"] = [
    { hpt: 40 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 30 }, // 5
    { hpt: 25 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 }, // 10
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 },
    { hpt: 20 }, // 15
    { hpt: 35 },
    { hpt: 30 },
    ...Array.from({ length: 30 }, () => ({ hpt: 20 })),
  ];
  sheet["!cols"] = [
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 9 },
    { wch: 10 },
    { wch: 10 },
    { wch: 20 },
  ];

  sheet["A1"] = {
    v: "BILL",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 24, bold: true },
      fill: { fgColor: { rgb: "CCCCFF" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  sheet["G2"] = {
    v: "Date:",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 12, underline: true },
      alignment: {
        horizontal: "right",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  sheet["A4"] = {
    v: "ATC JAPAN AUCTION PRODUCT TRADING",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 12, bold: true },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        bottom: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  ["B", "C", "D", "E"].forEach((col) => {
    sheet[`${col}4`] = {
      v: "",
      t: "s",
      s: {
        border: {
          bottom: { style: "double", color: { rgb: "000000" } },
        },
      },
    };
  });

  sheet["F6"] = {
    v: "Millennium Co., Ltd.",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 14, bold: true },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
    },
  };

  sheet["F7"] = {
    v: "9583-1 Tana, Chuo-ku, Sagamihara-shi",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
    },
  };

  sheet["F8"] = {
    v: "Kanagawa-ken, 252-0244, Japan",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
    },
  };

  sheet["F9"] = {
    v: "TEL　+81-(0)42-7 11-4057",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
    },
  };

  sheet["A9"] = {
    v: "TOTAL",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 10, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: false,
      },
      border: {
        bottom: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  ["A", "B", "C", "D"].forEach((col) => {
    sheet[`${col}11`] = {
      v: "",
      t: "s",
      s: {
        border: {
          bottom: { style: "double", color: { rgb: "000000" } },
        },
      },
    };
  });

  sheet["B9"] = {
    f: `'${workbook.SheetNames[0]}'!B1`,
    t: "n",
    z: '"PHP" #,##0.00',
    s: {
      font: { name: "メイリオ", sz: 10, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: false,
      },
      border: {
        bottom: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  sheet["H14"] = {
    v: "",
    t: "s",
    s: {
      border: {
        top: { style: "double", color: { rgb: "000000" } },
        right: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["H20"] = {
    v: "",
    t: "s",
    s: {
      border: {
        right: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  ["H15", "H16", "H17", "H18", "H19"].forEach((cell) => {
    sheet[cell] = {
      v: "",
      t: "s",
      s: {
        border: {
          right: { style: "double", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };
  });

  sheet["F12"] = {
    v: "Please transfer the payment to below account.",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
    },
  };

  sheet["F14"] = {
    v: "Account name:",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        top: { style: "double", color: { rgb: "000000" } },
        left: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G14"] = {
    v: "Millennium Co., Ltd.",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        top: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F15"] = {
    v: "Bank name: ",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G15"] = {
    v: "MIZUHO BANK, LTD. ",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F16"] = {
    v: "Bank address: ",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: false,
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F17"] = {
    v: "",
    t: "s",
    s: {
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G16"] = {
    v: "25-1 Matsugaecho, Minami-ku, ",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: false,
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G17"] = {
    v: "Sagamihara-shi, Kanagawa-ken , 252-0313, Japan",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F18"] = {
    v: "Branch: ",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G18"] = {
    v: "Odakyu Sagamihara branch  ",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F19"] = {
    v: "Account No: ",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G19"] = {
    v: "547-1181988",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F20"] = {
    v: "Swift code: ",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
        left: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G20"] = {
    v: "MHCBJPJT",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 8 },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: false,
      },
      border: {
        bottom: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  ["B22", "C22", "D22", "E22", "F22", "H22"].forEach((cell) => {
    sheet[cell] = {
      v: "",
      t: "s",
      s: {
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };
  });

  sheet["A22"] = {
    v: "Description",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 12 },
      fill: { fgColor: { rgb: "C0C0C0" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G22"] = {
    v: "Amount",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 12 },
      fill: { fgColor: { rgb: "C0C0C0" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A23"] = {
    v: `Second Hand Goods Container ${sheetDetails.barcode}【${
      sheetDetails.supplier.name
    }】 ${formatDate(new Date(sheetDetails.arrival_date), "MMMM dd yyyy")}`,
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 10 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G23"] = {
    f: `'${workbook.SheetNames[0]}'!B1`,
    t: "n",
    z: "#,##0.00",
    s: {
      font: { name: "メイリオ", sz: 10 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A25"] = {
    v: `BL NO. ${sheetDetails.bill_of_lading_number}`,
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 12 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["H23"] = {
    v: "",
    t: "s",
    s: {
      border: { right: { style: "thin", color: { rgb: "000000" } } },
    },
  };

  sheet["A31"] = {
    v: "TOTAL",
    t: "s",
    s: {
      font: { name: "メイリオ", sz: 12 },
      alignment: { horizontal: "right", vertical: "center" },
      border: { bottom: { style: "thin", color: { rgb: "000000" } } },
    },
  };

  sheet["G31"] = {
    f: `'${workbook.SheetNames[0]}'!B1`,
    t: "n",
    z: '"PHP" #,##0.00',
    s: {
      font: { name: "メイリオ", sz: 12 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  ["A", "B", "C", "D", "E", "F", "G", "H"].forEach((col) => {
    [24, 25, 26, 27, 28, 29, 30, 31].forEach((row) => {
      if (["A25", "A31", "G31"].includes(`${col}${row}`)) return;

      sheet[`${col}${row}`] = {
        v: "",
        t: "s",
        s: {
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
          },
        },
      };
    });
  });

  return sheet;
};

export default MillenniumBill;
