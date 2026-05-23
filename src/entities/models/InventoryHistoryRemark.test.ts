import test from "node:test";
import assert from "node:assert/strict";
import { inferCancelRefundTag } from "./InventoryHistoryRemark";

test("inferCancelRefundTag classifies missing items", () => {
  assert.equal(inferCancelRefundTag("MISSING"), "MISSING");
  assert.equal(inferCancelRefundTag("ITEM NOT FOUND"), "MISSING");
  assert.equal(inferCancelRefundTag("UNFOUND ITEMS"), "MISSING");
  assert.equal(inferCancelRefundTag("hindi makita ang items"), "MISSING");
});

test("inferCancelRefundTag classifies damage", () => {
  assert.equal(inferCancelRefundTag("ITEM IS DAMAGED"), "DAMAGED");
  assert.equal(inferCancelRefundTag("too much scratches"), "DAMAGED");
});

test("inferCancelRefundTag distinguishes not-declared-damaged from damaged", () => {
  assert.equal(inferCancelRefundTag("ITEM NOT DECLARED DAMAGED"), "NOT_DECLARED_DAMAGED");
  assert.equal(inferCancelRefundTag("MISDECLARATION OF THE ITEM"), "NOT_DECLARED_DAMAGED");
  assert.equal(inferCancelRefundTag("WRONG DECLERATION"), "NOT_DECLARED_DAMAGED");
});

test("inferCancelRefundTag classifies wrong bidder reassignments", () => {
  assert.equal(inferCancelRefundTag("ITEM BELONG TO BIDDER 102"), "WRONG_BIDDER");
  assert.equal(inferCancelRefundTag("TO BIDDER 0859"), "WRONG_BIDDER");
  assert.equal(inferCancelRefundTag("FOR BIDDER 0925"), "WRONG_BIDDER");
  assert.equal(inferCancelRefundTag("WRONG BIDDER NUMBER"), "WRONG_BIDDER");
  assert.equal(inferCancelRefundTag("BIDDER 0297"), "WRONG_BIDDER");
});

test("inferCancelRefundTag classifies rebid", () => {
  assert.equal(inferCancelRefundTag("REBID"), "REBID");
  assert.equal(inferCancelRefundTag("ALL ITEMS ARE REBID AND THE BIDDER IS BANNED"), "REBID");
});

test("inferCancelRefundTag classifies double encode", () => {
  assert.equal(inferCancelRefundTag("DOUBLE ENCODE"), "DOUBLE_ENCODE");
  assert.equal(inferCancelRefundTag("DOUBLE PRICE"), "DOUBLE_ENCODE");
});

test("inferCancelRefundTag classifies wrong encode", () => {
  assert.equal(inferCancelRefundTag("WRONG BARCODE"), "WRONG_ENCODE");
  assert.equal(inferCancelRefundTag("WRONG DESCRIPTION"), "WRONG_ENCODE");
  assert.equal(inferCancelRefundTag("WRONG DATE NAILAGAY"), "WRONG_ENCODE");
  assert.equal(inferCancelRefundTag("ORIGINAL PRICE 200"), "WRONG_ENCODE");
  assert.equal(inferCancelRefundTag("1000 in receipt 100 in control"), "WRONG_ENCODE");
});

test("inferCancelRefundTag classifies not claimed", () => {
  assert.equal(inferCancelRefundTag("HINDI KUMUKUHA NG SHOES SI BIDDER"), "NOT_CLAIMED");
});

test("inferCancelRefundTag classifies invoice errors", () => {
  assert.equal(inferCancelRefundTag("NOT INCLUDE IN INVOICE"), "INVOICE_ERROR");
  assert.equal(inferCancelRefundTag("NA ADD NASA INVOICE"), "INVOICE_ERROR");
  assert.equal(inferCancelRefundTag("INCLUDE THIS ITEMS FOR NEXT PAYMENT"), "INVOICE_ERROR");
});

test("inferCancelRefundTag classifies voided", () => {
  assert.equal(inferCancelRefundTag("ITEM VOIDED"), "VOIDED");
});

test("inferCancelRefundTag falls back to OTHER for empty or unrecognized input", () => {
  assert.equal(inferCancelRefundTag(""), "OTHER");
  assert.equal(inferCancelRefundTag("   "), "OTHER");
  assert.equal(inferCancelRefundTag(null), "OTHER");
  assert.equal(inferCancelRefundTag(undefined), "OTHER");
  assert.equal(inferCancelRefundTag("DISCREPANCY"), "OTHER");
});

test("inferCancelRefundTag handles real multi-reason remarks via first match", () => {
  // Multi-reason: first matching pattern wins; documented limitation. DAMAGED
  // is evaluated before WRONG_BIDDER, so SCRATCHES wins here.
  const reason = "3870 ITEM NOT BELONG TO BIDDER 81\n3910 ITEM HAS A SCRATCHES";
  assert.equal(inferCancelRefundTag(reason), "DAMAGED");
});
