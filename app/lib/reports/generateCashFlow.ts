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
}: // paymentMethods,
GenerateCashFlowProps) => {
  const rawData = payments.map((item) => ({
    date: formatDate(new Date(item.created_at), "MMMM dd, yyyy"),
    bidder: `BIDDER ${item.bidder.bidder_number}`,
    purpose: item.receipt.purpose.replace(/_/g, " ").toUpperCase(), // e.g., "PULL OUT"
    amount: item.amount_paid,
    payment_method: item.payment_method,
  }));

  // Extract first date
  const date = rawData[0]?.date || "";

  // Normalize & group
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
      .filter((item) => item.receipt.purpose !== "REFUNDED")
      .filter((item) => item.payment_method.name === paymentType)
      .reduce((acc, item) => (acc += item.amount_paid), 0);

  const refundAmount = payments
    .filter((item) => item.receipt.purpose === "REFUNDED")
    .reduce((acc, item) => (acc += item.amount_paid), 0);

  const totalCash = getTotal("CASH");
  const totalBDO = getTotal("BDO");
  const totalGCash = getTotal("GCASH");
  const totalBPI = getTotal("BPI");
  const totalRefund = refundAmount * -1;
  const totalInward = payments
    .filter((item) => item.receipt.purpose !== "REFUNDED")
    .reduce((acc, item) => (acc += item.amount_paid), 0);

  console.log({ totalInward });

  const inwardHeaders = ["DATE", "PARTICULAR", "AMOUNT", "PAYMENT TYPE"];

  const sheet = xlsx.utils.aoa_to_sheet([
    ...Array.from({ length: 11 }, () => [...Array(15).fill("")]),
    inwardHeaders,
    ...inward,
    ...Array.from({ length: 2 }, () => [...Array(15).fill("")]),
  ]);

  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // A2:D2
    { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }, // A3:B3
    { s: { r: 2, c: 2 }, e: { r: 2, c: 3 } }, // C3:D3
    { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } }, // A4:B4
    { s: { r: 3, c: 2 }, e: { r: 3, c: 3 } }, // C4:D4
    { s: { r: 4, c: 0 }, e: { r: 4, c: 1 } }, // A5:A5
    { s: { r: 4, c: 2 }, e: { r: 4, c: 3 } }, // C5:D5
    { s: { r: 5, c: 0 }, e: { r: 5, c: 1 } }, // A6:A6
    { s: { r: 5, c: 2 }, e: { r: 5, c: 3 } }, // C7:D7
    { s: { r: 6, c: 0 }, e: { r: 6, c: 1 } }, // A7:B7
    { s: { r: 6, c: 2 }, e: { r: 6, c: 3 } }, // C7:D7
    { s: { r: 7, c: 0 }, e: { r: 7, c: 1 } }, // A8:B8
    { s: { r: 7, c: 2 }, e: { r: 7, c: 3 } }, // C8:D8
    { s: { r: 8, c: 0 }, e: { r: 8, c: 1 } }, // A9:B9
    { s: { r: 8, c: 2 }, e: { r: 8, c: 3 } }, // C9:D9
    { s: { r: 9, c: 0 }, e: { r: 9, c: 3 } }, // A10:D10
    { s: { r: 10, c: 0 }, e: { r: 10, c: 1 } }, // A11:B11
    { s: { r: 10, c: 2 }, e: { r: 10, c: 3 } }, // C11:D11
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
  sheet["!autofilter"] = { ref: "A12:G12" };

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
      fill: { fgColor: { rgb: "8EA9DB" } },
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

  sheet["A3"] = {
    v: "CASH",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["B3"] = {
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

  sheet["C3"] = {
    v: formatNumberToCurrency(totalCash),
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["D3"] = {
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

  sheet["A4"] = {
    v: "BDO",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["B4"] = {
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

  sheet["C4"] = {
    v: formatNumberToCurrency(totalBDO),
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["D4"] = {
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

  sheet["A5"] = {
    v: "GCASH",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["B5"] = {
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

  sheet["C5"] = {
    v: formatNumberToCurrency(totalGCash),
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["D5"] = {
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

  sheet["A6"] = {
    v: "BPI",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["B6"] = {
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

  sheet["C6"] = {
    v: formatNumberToCurrency(totalBPI),
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["D6"] = {
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

  sheet["A7"] = {
    v: "REFUND",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["B7"] = {
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

  sheet["C7"] = {
    v: totalRefund,
    t: "n",
    z: '"₱" #,##0.00;("₱"[Red]#,##0.00)',
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["D7"] = {
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

  sheet["A8"] = {
    v: "PETTY CASH ON HAND",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["B8"] = {
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

  sheet["C8"] = {
    f: "G2",
    t: "n",
    z: "#,##0",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["D8"] = {
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

  sheet["A9"] = {
    v: "CASH REMIT",
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["B9"] = {
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

  sheet["C9"] = {
    v: formatNumberToCurrency(totalCash),
    t: "s",
    s: {
      font: { name: "Abadi", sz: 10, bold: true },
      fill: { fgColor: { rgb: "DDEBF7" } },
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

  sheet["D9"] = {
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

  sheet["A10"] = {
    v: "",
    t: "s",
    s: {
      fill: { fgColor: { rgb: "DDEBF7" } },
    },
  };

  sheet["A11"] = {
    v: "INWARD TOTAL CASH",
    t: "s",
    s: {
      font: { name: "Arial", sz: 12, bold: true },
      fill: { fgColor: { rgb: "8EA9DB" } },
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

  sheet["B11"] = {
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

  sheet["C11"] = {
    v: formatNumberToCurrency(totalInward),
    t: "s",
    s: {
      font: { name: "Arial", sz: 10, bold: true },
      fill: { fgColor: { rgb: "8EA9DB" } },
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

  sheet["D11"] = {
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

  // sheet["E5"] = {
  //   v: "PETTY CASH",
  //   t: "s",
  //   s: {
  //     font: { name: "Calibri", sz: 10 },
  //     fill: { fgColor: { rgb: "DDEBF7" } },
  //     alignment: {
  //       horizontal: "right",
  //       vertical: "center",
  //       wrapText: true,
  //     },
  //     border: {
  //       top: { style: "thin", color: { rgb: "000000" } },
  //       left: { style: "thin", color: { rgb: "000000" } },
  //       bottom: { style: "thin", color: { rgb: "000000" } },
  //     },
  //   },
  // };

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
    const headerCell = xlsx.utils.encode_cell({ r: 11, c: colIndex });
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
        r: rowIndex + 12,
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
    origin: { r: 11, c: 4 },
  });

  outwardHeaders.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({ r: 11, c: colIndex + 4 });
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
        r: rowIndex + 12,
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
