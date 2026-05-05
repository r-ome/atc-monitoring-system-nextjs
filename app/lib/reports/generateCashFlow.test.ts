import test from "node:test";
import assert from "node:assert/strict";

import generateCashFlow from "./generateCashFlow";
import { Expense, PettyCash } from "src/entities/models/Expense";
import { Payment } from "src/entities/models/Payment";
import { PaymentMethod } from "src/entities/models/PaymentMethod";

const createPaymentMethod = (name: string): PaymentMethod => ({
  payment_method_id: name.toLowerCase().replace(/\s+/g, "-"),
  name,
  state: "ENABLED",
  created_at: "2026-05-05T00:00:00.000Z",
  updated_at: "2026-05-05T00:00:00.000Z",
  deleted_at: null,
});

const createPayment = (
  purpose: Payment["receipt"]["purpose"],
  amount_paid: number,
  payment_method: PaymentMethod,
  bidder_number: string,
): Payment => ({
  payment_id: `${purpose}-${bidder_number}`,
  receipt_id: `receipt-${purpose}-${bidder_number}`,
  amount_paid,
  payment_method,
  created_at: "2026-05-05T08:00:00.000Z",
  auction_date: "2026-05-05T00:00:00.000Z",
  receipt: {
    receipt_id: `receipt-${purpose}-${bidder_number}`,
    receipt_number: `RN-${bidder_number}`,
    purpose,
  },
  bidder: {
    bidder_id: `bidder-${bidder_number}`,
    bidder_number,
    full_name: `Bidder ${bidder_number}`,
  },
});

const createExpense = (amount: number, remarks: string): Expense => ({
  expense_id: remarks.toLowerCase().replace(/\s+/g, "-"),
  amount,
  purpose: "EXPENSE",
  remarks,
  branch: {
    branch_id: "branch-1",
    name: "Main",
  },
  created_at: "2026-05-05T09:00:00.000Z",
  updated_at: "2026-05-05T09:00:00.000Z",
});

test("generateCashFlow keeps dynamic income and expense rows before signatures", () => {
  const paymentMethods = [
    "CASH",
    "GCASH",
    "BANK",
    "MAYA",
    "CHECK",
    "CREDIT CARD",
    "PAYPAL",
  ].map(createPaymentMethod);
  const [cash, gcash, bank, maya] = paymentMethods;
  const payments = [
    createPayment("PULL_OUT", 500, cash, "101"),
    createPayment("REFUNDED", 150, gcash, "102"),
    createPayment("ADD_ON", 250, bank, "103"),
    createPayment("STORAGE_FEE", 100, maya, "104"),
  ];
  const expenses = [
    createExpense(80, "Fuel"),
    createExpense(120, "Supplies"),
    createExpense(60, "Meals"),
  ];
  const yesterdayPettyCash: PettyCash = {
    petty_cash_id: "petty-cash-1",
    amount: 1000,
    remarks: "Opening balance",
    branch: {
      branch_id: "branch-1",
      name: "Main",
    },
    created_at: "2026-05-04T00:00:00.000Z",
    updated_at: "2026-05-04T00:00:00.000Z",
  };

  const sheet = generateCashFlow({
    payments,
    expenses,
    yesterdayPettyCash,
    paymentMethods,
  });

  const inwardPreparedByRow = 21;
  const outwardPreparedByRow = 19;

  assert.equal(sheet[`A${inwardPreparedByRow}`]?.v, "PREPARED BY: ");
  assert.equal(sheet[`E${outwardPreparedByRow}`]?.v, "PREPARED BY: ");

  for (let row = inwardPreparedByRow + 1; row <= inwardPreparedByRow + 4; row++) {
    assert.notEqual(sheet[`B${row}`]?.v, "BIDDER 104");
    assert.notEqual(sheet[`D${row}`]?.v, "MAYA");
  }

  for (let row = outwardPreparedByRow + 1; row <= outwardPreparedByRow + 4; row++) {
    assert.notEqual(sheet[`F${row}`]?.v, "Meals");
    assert.notEqual(sheet[`G${row}`]?.v, 60);
  }

  assert.equal(sheet["A17"]?.v, "PULLOUT");
  assert.equal(sheet["A18"]?.v, "ADD ON");
  assert.equal(sheet["A19"]?.v, "STORAGE FEE");
  assert.equal(sheet["A20"]?.v, "REFUND");

  assert.equal(sheet["C3"]?.f, 'SUMIF(D17:D19,"BANK",C17:C19)');
  assert.equal(sheet["C4"]?.f, 'SUMIF(D17:D19,"CASH",C17:C19)-ABS(C10)');
  assert.equal(sheet["C12"]?.f, 'SUMIF(D17:D19,"CASH",C17:C19)');
  assert.equal(sheet["C14"]?.f, "SUM(C17:C20)-ABS(C10)");
  assert.equal(sheet["H4"]?.f, "SUM(G16:G18)");
});
