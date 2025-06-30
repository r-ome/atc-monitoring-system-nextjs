import * as xlsx from "xlsx-js-style";

const ATCBill = (sheetDetails: any, workbook: xlsx.WorkBook) => {
  const sheet = xlsx.utils.aoa_to_sheet([
    ...Array.from({ length: 50 }, () => [...Array(8).fill(null)]),
  ]);

  sheet["!merges"] = [
    { s: { r: 3, c: 1 }, e: { r: 3, c: 3 } }, // B4:D4
    { s: { r: 7, c: 3 }, e: { r: 7, c: 6 } }, // D8:G8
    { s: { r: 8, c: 1 }, e: { r: 8, c: 6 } }, // B9:G9
    { s: { r: 9, c: 2 }, e: { r: 9, c: 6 } }, // C10:G10
    { s: { r: 12, c: 1 }, e: { r: 13, c: 6 } }, // B13:G14
    { s: { r: 14, c: 1 }, e: { r: 14, c: 6 } }, // B15:G15
    { s: { r: 15, c: 2 }, e: { r: 15, c: 6 } }, // C16:G16
    { s: { r: 16, c: 2 }, e: { r: 16, c: 6 } }, // C17:G17
    { s: { r: 17, c: 2 }, e: { r: 17, c: 6 } }, // C18:G18
    { s: { r: 18, c: 2 }, e: { r: 18, c: 6 } }, // C19:G19
    { s: { r: 19, c: 2 }, e: { r: 19, c: 6 } }, // C20:G20
    { s: { r: 20, c: 2 }, e: { r: 20, c: 6 } }, // C21:G21
    { s: { r: 21, c: 1 }, e: { r: 21, c: 6 } }, // B22:G22
    { s: { r: 22, c: 1 }, e: { r: 22, c: 4 } }, // B23:E23
    { s: { r: 22, c: 5 }, e: { r: 22, c: 6 } }, // F23:G23
    { s: { r: 23, c: 1 }, e: { r: 24, c: 4 } }, // B24:E25
    { s: { r: 23, c: 5 }, e: { r: 24, c: 6 } }, // F24:G25
    { s: { r: 25, c: 1 }, e: { r: 25, c: 4 } }, // B26:E26
    { s: { r: 26, c: 1 }, e: { r: 26, c: 4 } }, // B27:E27
    { s: { r: 27, c: 1 }, e: { r: 27, c: 4 } }, // B28:E28
    { s: { r: 28, c: 1 }, e: { r: 28, c: 4 } }, // B29:E29
    { s: { r: 29, c: 1 }, e: { r: 29, c: 4 } }, // B30:E30
    { s: { r: 30, c: 1 }, e: { r: 30, c: 4 } }, // B31:E31
    { s: { r: 31, c: 1 }, e: { r: 31, c: 4 } }, // B32:E32
    { s: { r: 32, c: 1 }, e: { r: 37, c: 4 } }, // B33:E38
    { s: { r: 25, c: 5 }, e: { r: 25, c: 6 } }, // F26:G26
    { s: { r: 26, c: 5 }, e: { r: 26, c: 6 } }, // F27:G27
    { s: { r: 27, c: 5 }, e: { r: 27, c: 6 } }, // F28:G28
    { s: { r: 28, c: 5 }, e: { r: 28, c: 6 } }, // F29:G29
    { s: { r: 29, c: 5 }, e: { r: 29, c: 6 } }, // F30:G30
    { s: { r: 30, c: 5 }, e: { r: 30, c: 6 } }, // F31:G31
    { s: { r: 31, c: 5 }, e: { r: 31, c: 6 } }, // F32:G32
    { s: { r: 32, c: 5 }, e: { r: 37, c: 6 } }, // F33:G38
  ];
  sheet["!rows"] = [{ hpt: 15 }, { hpt: 15 }, { hpt: 15 }, { hpt: 30 }];
  sheet["!cols"] = [
    { wch: 9 },
    { wch: 13 },
    { wch: 9 },
    { wch: 15 },
    { wch: 15 },
    { wch: 9 },
    { wch: 20 },
  ];

  ["C", "D", "E", "F"].forEach((col) => {
    sheet[`${col}3`] = {
      v: "",
      t: "s",
      s: {
        border: { top: { style: "medium", color: { rgb: "000000" } } },
      },
    };
  });

  sheet["G3"] = {
    v: "",
    t: "s",
    s: {
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B3"] = {
    v: "",
    t: "s",
    s: {
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B4"] = {
    v: "ATC GROUP",
    t: "s",
    s: {
      font: { name: "Arial", sz: 18, bold: true },
      alignment: {
        horizontal: "right",
        vertical: "center",
        wrapText: true,
      },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B5"] = {
    v: "2-4-35 KITAMURA BUILDING 1ST FLOOR",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      alignment: {
        horizontal: "left",
        vertical: "center",
      },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B6"] = {
    v: "KASUGA-CHO, NERIMA-KU TOKYO",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      alignment: {
        horizontal: "left",
        vertical: "center",
      },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B7"] = {
    v: "TEL: 03-5848-2906",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      alignment: {
        horizontal: "left",
        vertical: "center",
      },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B8"] = {
    v: "FAX: 03-5848-2907",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      alignment: {
        horizontal: "left",
        vertical: "center",
      },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["D8"] = {
    v: "Date:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      alignment: {
        horizontal: "right",
        vertical: "center",
      },
    },
  };

  ["4", "5", "6", "7", "8"].forEach((row) => {
    sheet[`G${row}`] = {
      v: "",
      t: "s",
      s: {
        border: { right: { style: "medium", color: { rgb: "000000" } } },
      },
    };
  });

  sheet["B9"] = {
    v: "PAYMENT ORDER",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 24, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  ["C", "D", "E", "F", "G"].forEach((col) => {
    [9, 10].forEach((row) => {
      if ("C10" === `${col}${row}`) return;
      sheet[`${col}${row}`] = {
        v: "",
        t: "s",
        s: {
          border: {
            top: { style: "medium", color: { rgb: "000000" } },
            right: { style: "medium", color: { rgb: "000000" } },
          },
        },
      };
    });
  });

  sheet["B10"] = {
    v: "Bill to:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        right: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C10"] = {
    v: "ATC JAPAN AUCTION PRODUCT TRADING ",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  ["B11", "B12", "B14"].forEach((cell) => {
    sheet[cell] = {
      v: "",
      t: "s",
      s: {
        border: {
          left: { style: "medium", color: { rgb: "000000" } },
        },
      },
    };
  });

  // G11:G37
  Array(27)
    .fill("")
    .forEach((_, i) => {
      sheet[`G${i + 11}`] = {
        v: "",
        t: "s",
        s: {
          border: {
            right: { style: "medium", color: { rgb: "000000" } },
          },
        },
      };
    });

  sheet["B13"] = {
    v: "Please transfer the payment to the account below.",
    t: "s",
    s: {
      font: { name: "Arial Rounded MT", sz: 14 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B15"] = {
    v: "BENEFICIARY INFORMATION",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 24, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "medium", color: { rgb: "000000" } },
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B16"] = {
    v: "Account name:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B17"] = {
    v: "Bank name:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B18"] = {
    v: "Bank address:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B19"] = {
    v: "Branch:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B20"] = {
    v: "Account No:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B21"] = {
    v: "Swift code/BIC:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "left", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  ["B", "C", "D", "E", "F", "G"].forEach((col) => {
    sheet[`${col}22`] = {
      v: "",
      t: "s",
      s: {
        border: {
          left: { style: "medium", color: { rgb: "000000" } },
          right: { style: "medium", color: { rgb: "000000" } },
          bottom: { style: "medium", color: { rgb: "000000" } },
        },
      },
    };
  });

  sheet["C16"] = {
    v: "ATCGROUP,LLC",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C17"] = {
    v: "RAKUTEN BANK, LTD.",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C18"] = {
    v: "2-16-5 KONAN, MINATO-KU, TOKYO, JAPAN",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C19"] = {
    v: "HEAD OFFICE",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C20"] = {
    v: "7111500",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["C21"] = {
    v: "RAKTJPJT",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "double", color: { rgb: "000000" } },
        bottom: { style: "double", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B23"] = {
    v: "Description",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F23"] = {
    v: "Amount",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      fill: { fgColor: { rgb: "BDD7EE" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B24"] = {
    v: `Second Hand Goods Container ${sheetDetails.barcode}【${sheetDetails.supplier.name}】`,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11, bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B25"] = {
    v: "",
    t: "s",
    s: {
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F24"] = {
    f: `'${workbook.SheetNames[0]}'!B1`,
    t: "n",
    z: "#,##0.00",
    s: {
      font: { name: "Calibri", sz: 12, bold: true },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B26"] = {
    v: `BL NO. ${sheetDetails.bill_of_lading_number}`,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11, bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
        bottom: { style: "medium", color: { rgb: "000000" } },
        top: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["B33"] = {
    v: `TOTAL`,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 18, bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  sheet["F33"] = {
    f: `'${workbook.SheetNames[0]}'!B1`,
    t: "n",
    z: "#,##0.00",
    s: {
      font: { name: "Calibri", sz: 18, bold: true },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        left: { style: "medium", color: { rgb: "000000" } },
      },
    },
  };

  ["D", "E", "F", "G"].forEach((col) => {
    [16, 17, 18, 19, 20, 21].forEach((row) => {
      sheet[`${col}${row}`] = {
        v: "",
        t: "s",
        s: {
          border: {
            right: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "double", color: { rgb: "000000" } },
          },
        },
      };
    });
  });

  [25, 26, 27, 28, 29, 30, 31, 32].forEach((row) => {
    ["B", "C", "D", "E", "F", "G"].forEach((col) => {
      if (["B25", "B26"].includes(`${col}${row}`)) return;
      sheet[`${col}${row}`] = {
        v: "",
        t: "s",
        s: {
          border: {
            right: { style: "medium", color: { rgb: "000000" } },
            left: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
          },
        },
      };
    });
  });

  [34, 35, 36, 37, 38].forEach((row) => {
    sheet[`B${row}`] = {
      v: "",
      t: "s",
      s: {
        border: {
          left: { style: "medium", color: { rgb: "000000" } },
          ...(`B${row}` === "B38"
            ? { bottom: { style: "medium", color: { rgb: "000000" } } }
            : {}),
        },
      },
    };
  });

  ["C", "D", "E", "F", "G"].forEach((col) => {
    sheet[`${col}38`] = {
      v: "",
      t: "s",
      s: {
        border: {
          bottom: { style: "medium", color: { rgb: "000000" } },
          ...(["E38", "G38"].includes(`${col}38`)
            ? { right: { style: "medium", color: { rgb: "000000" } } }
            : {}),
        },
      },
    };
  });

  [33, 34, 35, 36, 37].forEach((row) => {
    sheet[`E${row}`] = {
      v: "",
      t: "s",
      s: {
        border: {
          right: { style: "medium", color: { rgb: "000000" } },
        },
      },
    };
  });

  ["C", "D", "E", "F", "G"].forEach((col) => {
    [14, 15, 23].forEach((row) => {
      if (["F23"].includes(`${col}${row}`)) return;
      sheet[`${col}${row}`] = {
        v: "",
        t: "s",
        s: {
          border: {
            right: { style: "medium", color: { rgb: "000000" } },
            bottom: { style: "medium", color: { rgb: "000000" } },
          },
        },
      };
    });
  });

  return sheet;
};

export default ATCBill;
