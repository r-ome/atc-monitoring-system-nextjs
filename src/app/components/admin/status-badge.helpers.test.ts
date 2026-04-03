import test from "node:test";
import assert from "node:assert/strict";
import {
  formatAuctionStatusLabel,
  formatBranchLabel,
  formatInventoryStatusLabel,
  getAuctionStatusVariant,
  getBranchBadgeVariant,
  getInventoryStatusVariant,
} from "@/app/components/admin/status-badge.helpers";

test("status badge helpers map inventory statuses to the expected labels and variants", () => {
  assert.equal(getInventoryStatusVariant("SOLD"), "success");
  assert.equal(getInventoryStatusVariant("UNSOLD"), "error");
  assert.equal(getInventoryStatusVariant("BOUGHT_ITEM"), "success");
  assert.equal(formatInventoryStatusLabel("BOUGHT_ITEM"), "Bought Item");
});

test("status badge helpers map auction statuses to the expected labels and variants", () => {
  assert.equal(getAuctionStatusVariant("PAID"), "success");
  assert.equal(getAuctionStatusVariant("UNPAID"), "error");
  assert.equal(getAuctionStatusVariant("CANCELLED"), "neutral");
  assert.equal(getAuctionStatusVariant("REFUNDED"), "info");
  assert.equal(getAuctionStatusVariant("DISCREPANCY"), "warning");
  assert.equal(getAuctionStatusVariant("PARTIAL"), "warning");
  assert.equal(formatAuctionStatusLabel("DISCREPANCY"), "Discrepancy");
});

test("status badge helpers map known branches and fall back unknown branches to neutral", () => {
  assert.equal(getBranchBadgeVariant("TARLAC"), "tarlac");
  assert.equal(getBranchBadgeVariant("binan"), "binan");
  assert.equal(getBranchBadgeVariant("  unknown  "), "neutral");
  assert.equal(formatBranchLabel("TARLAC"), "Tarlac");
  assert.equal(formatBranchLabel("binan"), "Binan");
});
