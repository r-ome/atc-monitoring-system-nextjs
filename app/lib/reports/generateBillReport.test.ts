import test from "node:test";
import assert from "node:assert/strict";
import * as xlsx from "xlsx-js-style";

import ATCBill from "./ATCBill";
import MillenniumBill from "./MillenniumBill";

const buildWorkbook = () => {
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.aoa_to_sheet([["monitoring"]]),
    "SUPPLIER 32-04",
  );
  xlsx.utils.book_append_sheet(
    workbook,
    xlsx.utils.aoa_to_sheet([["final computation"]]),
    "FINAL COMPUTATION",
  );
  return workbook;
};

const sheetDetails = {
  barcode: "32-04",
  supplier: { name: "Supplier" },
  arrival_date: "2026-05-07T00:00:00.000Z",
  bill_of_lading_number: "BL-001",
};

test("ATCBill amount cells match FINAL COMPUTATION transfer amount", () => {
  const sheet = ATCBill(sheetDetails, buildWorkbook());

  assert.equal(sheet["F24"]?.f, "'FINAL COMPUTATION'!F9");
  assert.equal(sheet["F33"]?.f, "'FINAL COMPUTATION'!F9");
});

test("MillenniumBill amount cells match FINAL COMPUTATION transfer amount", () => {
  const sheet = MillenniumBill(sheetDetails, buildWorkbook());

  assert.equal(sheet["B9"]?.f, "'FINAL COMPUTATION'!F9");
  assert.equal(sheet["G23"]?.f, "'FINAL COMPUTATION'!F9");
  assert.equal(sheet["G31"]?.f, "'FINAL COMPUTATION'!F9");
});
