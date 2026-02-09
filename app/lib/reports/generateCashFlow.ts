import * as xlsx from "xlsx-js-style";
import { formatDate } from "@/app/lib/utils";
import { Payment } from "src/entities/models/Payment";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { Expense, PettyCash } from "src/entities/models/Expense";
import { PaymentMethod } from "src/entities/models/PaymentMethod";

type GenerateCashFlowProps = {
  payments: Payment[];
  expenses: Expense[];
  yesterdayPettyCash: PettyCash;
  paymentMethods: PaymentMethod[];
};

const generateCashFlow = ({
  payments,
  expenses,
  yesterdayPettyCash,
  paymentMethods,
}: GenerateCashFlowProps) => {
  const rawData = payments.map((item) => ({
    date: formatDate(new Date(item.created_at), "MMMM dd, yyyy"),
    bidder: `BIDDER ${item.bidder.bidder_number}`,
    purpose: item.receipt.purpose.replace(/_/g, " ").toUpperCase(), // e.g., "PULL OUT"
    amount: item.amount_paid,
    payment_method: item.payment_method.name,
  }));
  const totalTransactaionsExcludingRefund = payments.filter(
    (item) => item.receipt.purpose !== "REFUNDED",
  ).length;

  const normalizeAction = (purpose: string) => {
    const p = purpose.trim().toUpperCase();
    if (p === "PULL OUT") return "PULLOUT";
    if (p === "REFUNDED") return "REFUND";
    return p;
  };
  const date = rawData[0]?.date || "";
  const grouped = rawData.map((item) => {
    return {
      action: normalizeAction(item.purpose),
      bidder: item.bidder,
      amount: item.amount,
      payment_method: item.payment_method,
    };
  });

  const order = { REGISTRATION: 0, PULLOUT: 1, REFUND: 2 };
  const sorted = grouped.sort((a, b) => {
    const oa = order[a.action as "REGISTRATION" | "PULLOUT" | "REFUND"] ?? 999;
    const ob = order[b.action as "REGISTRATION" | "PULLOUT" | "REFUND"] ?? 999;
    return oa - ob;
  });

  const seen = new Set();
  const finalRows = sorted.map((item) => {
    const label = seen.has(item.action) ? "" : item.action;
    seen.add(item.action);
    return [label, item.bidder, item.amount, item.payment_method];
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
      .filter((item) => item.payment_method.name === paymentType)
      .reduce((acc, item) => {
        if (item.receipt.purpose === "REFUNDED") {
          acc -= item.amount_paid;
        } else {
          acc += item.amount_paid;
        }
        return acc;
      }, 0);

  const refundAmount = payments
    .filter((item) => item.receipt.purpose === "REFUNDED")
    .reduce((acc, item) => (acc += item.amount_paid), 0);

  const total_payments = paymentMethods.reduce(
    (acc, item) => {
      acc[item.name] = formatNumberToCurrency(getTotal(item.name));
      return acc;
    },
    {} as Record<string, string>,
  );

  const total_petty_cash = expenses.reduce((acc, item) => {
    if (item.purpose === "ADD_PETTY_CASH") {
      return (acc += item.amount);
    }
    return acc;
  }, 0);

  const totalRefund = refundAmount * -1;

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
    { s: { r: 1, c: 4 }, e: { r: 1, c: 6 } }, // E2:G2
    { s: { r: 2, c: 4 }, e: { r: 2, c: 6 } }, // E3:G3
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
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ];
  sheet["!autofilter"] = {
    ref: `A${Object.keys(total_payments).length + 8}:G${
      Object.keys(total_payments).length + 8
    }`,
  };
  const refund_row = Object.keys(total_payments).length + 3;
  const petty_cash_row = refund_row + 1;
  const cash_remit_row = petty_cash_row + 1;
  const inward_total_cash_row = cash_remit_row + 2;

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
        f: `SUMIF(D15:D${
          totalTransactaionsExcludingRefund + 14
        },"${item}",C15:C${totalTransactaionsExcludingRefund + 14})${item === "CASH" ? `-ABS(C${refund_row})` : ""}`,
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
    });

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
    f: "H2",
    t: "n",
    z: "#,##0.00",
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
    f: `SUMIF(D15:D${totalTransactaionsExcludingRefund + 14},"CASH",C15:C${
      totalTransactaionsExcludingRefund + 14
    })`,
    t: "n",
    z: "#,##0.00",
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
    f: `SUM(C15:C${inward.length + 14})-ABS(C${refund_row})`,
    t: "n",
    z: '"₱" #,##0.00;"₱" [Red]-#,##0.00',
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
      new Date(date),
      "MMMM dd, yyyy",
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
      new Date(date),
      "MMMM dd, yyyy",
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
      fill: { fgColor: { rgb: "9BC2E6" } },
      alignment: {
        horizontal: "center",
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
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["G4"] = {
    v: "TOTAL EXPENSES",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 10 },
      alignment: {
        horizontal: "right",
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

  sheet[`A${cash_remit_row + 1}`] = {
    v: "",
    t: "s",
    s: {
      fill: { fgColor: { rgb: "BDD7EE" } },
    },
  };

  sheet["H2"] = {
    f: "H3-H4",
    t: "n",
    z: '"₱" #,##0.00;"₱" [Red]-#,##0.00',
    s: {
      font: { name: "Calibri", sz: 14, color: { rgb: "F00000" } },
      fill: { fgColor: { rgb: "9BC2E6" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["H3"] = {
    f: "K6",
    t: "n",
    z: '"₱" #,##0.00',
    s: {
      font: { name: "Calibri", sz: 14 },
      fill: { fgColor: { rgb: "9BC2E6" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["H4"] = {
    f: `SUM(G14:G${outward.length + 13})`,
    t: "n",
    z: '"₱" #,##0.00;"₱" [Red]-#,##0.00',
    s: {
      font: { name: "Calibri", sz: 14 },
      fill: { fgColor: { rgb: "9BC2E6" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  ["B2", "C2", "D2", "F2", "F3", "G2", "G3"].forEach((cell) => {
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
    v: yesterdayPettyCash.amount,
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
    v: formatDate(new Date(yesterdayPettyCash.created_at), "MMM-dd-yyyy"),
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
    v: formatDate(new Date(date), "MMM-dd-yyyy"),
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
    v: total_petty_cash,
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
