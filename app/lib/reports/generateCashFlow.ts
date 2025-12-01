import * as xlsx from "xlsx-js-style";
import { formatDate } from "@/app/lib/utils";
import { Payment } from "src/entities/models/Payment";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Expense } from "src/entities/models/Expense";
import { PaymentMethod } from "src/entities/models/PaymentMethod";

type GenerateCashFlowProps = {
  payments: Payment[];
  expenses: Expense[];
  yesterdayBalance: number;
  paymentMethods: PaymentMethod[];
};

const generateCashFlow = ({
  payments,
  expenses,
  yesterdayBalance,
  paymentMethods,
}: GenerateCashFlowProps) => {
  const rawData = payments.map((item) => ({
    date: formatDate(new Date(item.created_at), "MMMM dd, yyyy"),
    bidder: `BIDDER ${item.bidder.bidder_number}`,
    purpose: item.receipt.purpose.replace(/_/g, " ").toUpperCase(), // e.g., "PULL OUT"
    amount: item.amount_paid,
    payment_method: item.payment_method,
  }));
  const date = rawData[0]?.date || "";
  const grouped = rawData.map((item) => {
    const action = item.purpose === "PULL OUT" ? "PULLOUT" : item.purpose;
    return {
      action,
      bidder: item.bidder,
      amount: item.amount,
      payment_method: item.payment_method,
    };
  });

  const order = { REGISTRATION: 0, PULLOUT: 1, REFUND: 2 };
  const sorted = grouped.sort(
    (a, b) =>
      order[a.action as "REGISTRATION" | "PULLOUT" | "REFUND"] -
      order[b.action as "REGISTRATION" | "PULLOUT" | "REFUND"]
  );
  const seen = new Set();
  const finalRows = sorted.map((item) => {
    const label = seen.has(item.action) ? "" : item.action;
    seen.add(item.action);
    return [label, item.bidder, item.amount, item.payment_method.name];
  });
  const inward = [[date, "", "", ""], ...finalRows];

  const outward = expenses
    .filter((item) => item.purpose === "EXPENSE")
    .map((item, i) => [
      i === 0 ? formatDate(new Date(item.created_at), "MMMM dd, yyyy") : "",
      item.remarks,
      item.amount,
    ]);

  const getTotal = (paymentType: PaymentMethod["name"]) =>
    payments
      .filter((item) => item.receipt.purpose !== "REFUNDED")
      .filter((item) => item.payment_method.name === paymentType)
      .reduce((acc, item) => (acc += item.amount_paid), 0);

  const refundAmount = payments
    .filter((item) => item.receipt.purpose === "REFUNDED")
    .reduce((acc, item) => (acc += item.amount_paid), 0);

  const total_payments = paymentMethods.reduce((acc, item) => {
    acc[item.name] = formatNumberToCurrency(getTotal(item.name));
    return acc;
  }, {} as Record<string, string>);

  const totalRefund = refundAmount * -1;
  const totalInward = payments
    .filter((item) => item.receipt.purpose !== "REFUNDED")
    .reduce((acc, item) => (acc += item.amount_paid), 0);

  const inwardHeaders = ["DATE", "PARTICULAR", "AMOUNT", "PAYMENT TYPE"];

  const sheet = xlsx.utils.aoa_to_sheet([
    ...Array.from({ length: Object.keys(total_payments).length + 7 }, () => [
      ...Array(15).fill(""),
    ]),
    inwardHeaders,
    ...inward,
    ...Array.from({ length: 4 }, () => [...Array(15).fill("")]),
  ]);

  // payment_methods
  // + refund + cash remit + petty cash
  const dynamic_merges = [
    ...Object.keys(total_payments),
    ...Array(3).fill(null),
  ].map((_, i) => {
    const row = i + 2;
    return [
      { s: { r: row, c: 0 }, e: { r: row, c: 1 } },
      { s: { r: row, c: 2 }, e: { r: row, c: 3 } },
    ];
  });
  const divider_row = dynamic_merges.length + 2;
  const inward_total_cash_row_merge = divider_row + 1;

  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // A2:D2
    ...dynamic_merges.flat(),
    {
      s: { r: divider_row, c: 0 },
      e: { r: divider_row, c: 3 },
    }, // A:D - divider from breakdown and table
    {
      s: { r: inward_total_cash_row_merge, c: 0 },
      e: { r: inward_total_cash_row_merge, c: 1 },
    },
    {
      s: { r: inward_total_cash_row_merge, c: 2 },
      e: { r: inward_total_cash_row_merge, c: 3 },
    },
    { s: { r: 0, c: 4 }, e: { r: 0, c: 7 } }, // E1:H1
    { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, // E2:F2
    { s: { r: 1, c: 6 }, e: { r: 1, c: 7 } }, // G2:H2
    { s: { r: 2, c: 4 }, e: { r: 2, c: 5 } }, // E3:F3
    { s: { r: 2, c: 6 }, e: { r: 2, c: 7 } }, // G3:H3
    { s: { r: 3, c: 4 }, e: { r: 3, c: 5 } }, // E4:F4
    { s: { r: 3, c: 6 }, e: { r: 3, c: 7 } }, // G3:H3
  ];

  sheet["!rows"] = [{ hpt: 40 }];
  sheet["!cols"] = [
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 25 },
    { wch: 25 },
    { wch: 20 },
  ];
  sheet["!autofilter"] = {
    ref: `A${Object.keys(total_payments).length + 8}:G${
      Object.keys(total_payments).length + 8
    }`,
  };

  Object.keys(total_payments)
    .sort((a, b) => a.localeCompare(b))
    .forEach((item, index) => {
      const row = index + 3;
      sheet[`A${row}`] = {
        v: item,
        t: "s",
        s: {
          font: { name: "Abadi", sz: 10, bold: true },
          fill: { fgColor: { rgb: "D9E1F2" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
          },
        },
      };
      ["B", "D"].forEach((item) => {
        sheet[`${item}${row}`] = {
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
      sheet[`C${row}`] = {
        v: total_payments[item],
        t: "s",
        s: {
          font: { name: "Abadi", sz: 10, bold: true },
          fill: { fgColor: { rgb: "D9E1F2" } },
          alignment: {
            horizontal: "center",
            vertical: "center",
            wrapText: true,
          },
          border: {
            top: { style: "thin", color: { rgb: "000000" } },
            right: { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
          },
        },
      };
    });

  const refund_row = Object.keys(total_payments).length + 3;
  sheet[`A${refund_row}`] = {
    v: "REFUND",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  sheet[`C${refund_row}`] = {
    v: totalRefund,
    t: "n",
    z: '"₱" #,##0.00;("₱"[Red]#,##0.00)',
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  ["B", "D"].forEach((item) => {
    sheet[`${item}${refund_row}`] = {
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

  const petty_cash_row = refund_row + 1;
  sheet[`A${petty_cash_row}`] = {
    v: "PETTY CASH ON HAND",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  sheet[`C${petty_cash_row}`] = {
    f: "G2",
    t: "n",
    z: "#,##0",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  ["B", "D"].forEach((item) => {
    sheet[`${item}${petty_cash_row}`] = {
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

  const cash_remit_row = petty_cash_row + 1;
  sheet[`A${cash_remit_row}`] = {
    v: "CASH REMIT",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  sheet[`C${cash_remit_row}`] = {
    v: total_payments.CASH,
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  ["B", "D"].forEach((item) => {
    sheet[`${item}${cash_remit_row}`] = {
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

  const inward_total_cash_row = cash_remit_row + 2;
  sheet[`A${inward_total_cash_row}`] = {
    v: "INWARD TOTAL CASH",
    t: "s",
    s: {
      font: { name: "Arial", sz: 12, bold: true },
      fill: { fgColor: { rgb: "9BC2E6" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  sheet[`C${inward_total_cash_row}`] = {
    v: formatNumberToCurrency(totalInward),
    t: "s",
    s: {
      font: { name: "Arial", sz: 10, bold: true },
      fill: { fgColor: { rgb: "9BC2E6" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  ["B", "D"].forEach((item) => {
    sheet[`${item}${inward_total_cash_row}`] = {
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

  sheet["A1"] = {
    v: `ATC JAPAN AUCTION DAILY CASH FLOW ${formatDate(
      new Date(),
      "MMMM dd, yyyy"
    ).toUpperCase()}`,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  sheet["E1"] = {
    v: `ATC JAPAN AUCTION DAILY CASH FLOW ${formatDate(
      new Date(),
      "MMMM dd, yyyy"
    ).toUpperCase()}`,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  sheet["A2"] = {
    v: "CASH BOOK",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      fill: { fgColor: { rgb: "9BC2E6" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  sheet["E2"] = {
    v: "CASH ON HAND FOR PETTY CASH",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 10 },
      fill: { fgColor: { rgb: "DDEBF7" } },
      alignment: {
        horizontal: "right",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["E3"] = {
    v: "PETTY CASH BALANCE",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 10 },
      fill: { fgColor: { rgb: "DDEBF7" } },
      alignment: {
        horizontal: "right",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["E4"] = {
    v: "TOTAL EXPENSES",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 10 },
      fill: { fgColor: { rgb: "DDEBF7" } },
      alignment: {
        horizontal: "right",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`A${cash_remit_row + 1}`] = {
    v: "",
    t: "s",
    s: {
      fill: { fgColor: { rgb: "BDD7EE" } },
    },
  };

  sheet["G2"] = {
    f: "G3-G4",
    t: "n",
    z: '"₱" #,##0.00;"₱" [Red]-#,##0.00',
    s: {
      font: { name: "Calibri", sz: 14 },
      fill: { fgColor: { rgb: "DDEBF7" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G3"] = {
    v: yesterdayBalance,
    t: "n",
    z: '"₱" #,##0.00',
    s: {
      font: { name: "Calibri", sz: 14 },
      fill: { fgColor: { rgb: "DDEBF7" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G4"] = {
    f: `SUM(G13:G${outward.length + 13})`,
    t: "n",
    z: '"₱" #,##0.00;"₱" [Red]-#,##0.00',
    s: {
      font: { name: "Calibri", sz: 14 },
      fill: { fgColor: { rgb: "DDEBF7" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  ["B2", "C2", "D2", "F4", "F2", "F3", "H3", "H2", "H4"].forEach((cell) => {
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

  inwardHeaders.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({
      r: Object.keys(total_payments).length + 7,
      c: colIndex,
    });
    if (!sheet[headerCell]) return;
    sheet[headerCell].s = {
      font: { name: "Calibri", sz: 11, bold: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };
  });

  inward.forEach((rowValue, rowIndex) => {
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

    inwardHeaders.forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: rowIndex + 13,
        c: colIndex,
      });

      if (sheet[cellAddress]) {
        if (cellAddress.includes("C")) {
          sheet[cellAddress].v = rowValue[colIndex];
          sheet[cellAddress].t = "n";
          sheet[cellAddress].z = '"₱"#,##0.00;("₱"[Red]#,##0.00)';
        }
        sheet[cellAddress].s = style;
      }
    });
  });

  sheet[`A${inward.length + 14}`] = {
    v: "PREPARED BY: ",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`B${inward.length + 14}`] = {
    v: "",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`C${inward.length + 14}`] = {
    v: "CHECKED AND APPROVED BY:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`D${inward.length + 14}`] = {
    v: "",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };
  const outwardHeaders = ["DATE", "PARTICULAR", "AMOUNT"];

  xlsx.utils.sheet_add_aoa(sheet, [outwardHeaders, ...outward], {
    origin: { r: Object.keys(total_payments).length + 7, c: 4 },
  });

  outwardHeaders.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({
      r: Object.keys(total_payments).length + 7,
      c: colIndex + 4,
    });
    if (!sheet[headerCell]) return;
    sheet[headerCell].s = {
      font: { name: "Calibri", sz: 11, bold: true },
      fill: { fgColor: { rgb: "D9E1F2" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };
  });

  outward.forEach((rowValue, rowIndex) => {
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

    outwardHeaders.forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: rowIndex + 13,
        c: colIndex + 4,
      });

      if (sheet[cellAddress]) {
        if (cellAddress.includes("G")) {
          sheet[cellAddress].v = rowValue[colIndex];
          sheet[cellAddress].t = "n";
          sheet[cellAddress].z = '"₱"#,##0.00';
        }
        sheet[cellAddress].s = style;
      }
    });
  });

  sheet[`E${outward.length + 14}`] = {
    v: "PREPARED BY: ",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`F${outward.length + 14}`] = {
    v: "",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`G${outward.length + 14}`] = {
    v: "CHECKED AND APPROVED BY:",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 10 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`H${outward.length + 14}`] = {
    v: "",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`J4`] = {
    v: "BALANCE PETTY CASH",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11, color: { rgb: "F00000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`J5`] = {
    v: "PETTY CASH",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11, color: { rgb: "F00000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`J6`] = {
    v: "TOTAL",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11, color: { rgb: "F00000" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet[`K4`] = {
    v: yesterdayBalance,
    t: "n",
    z: '"₱" #,##0.00',
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["L4"] = {
    v: formatDate(new Date(), "dd-MM-yyyy"),
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["L5"] = {
    v: formatDate(new Date(), "dd-MM-yyyy"),
    t: "s",
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["K5"] = {
    v: `0`,
    t: "n",
    z: '"₱" #,##0.00;"₱" [Red]-#,##0.00',
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["K6"] = {
    f: `SUM(K4:K5)`,
    t: "n",
    z: '"₱" #,##0.00;"₱" [Red]-#,##0.00',
    s: {
      font: { name: "Calibri", sz: 11 },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["L6"] = {
    v: "",
    t: "s",
    s: {
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  return sheet;
};

export default generateCashFlow;
