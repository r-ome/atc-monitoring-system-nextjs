import test from "node:test";
import assert from "node:assert/strict";

import { parseAuctionInventorySearchInput } from "./Auction";

test("parseAuctionInventorySearchInput accepts numeric and alphanumeric barcodes", () => {
  assert.deepEqual(parseAuctionInventorySearchInput("32-04-001"), {
    raw: "32-04-001",
    mode: "barcode",
    barcode: "32-04-001",
  });

  assert.deepEqual(parseAuctionInventorySearchInput("T0-01"), {
    raw: "T0-01",
    mode: "barcode",
    barcode: "T0-01",
  });

  assert.deepEqual(parseAuctionInventorySearchInput("s1-07"), {
    raw: "s1-07",
    mode: "barcode",
    barcode: "S1-07",
  });

  assert.deepEqual(parseAuctionInventorySearchInput("108-03-301"), {
    raw: "108-03-301",
    mode: "barcode",
    barcode: "108-03-301",
  });
});

test("parseAuctionInventorySearchInput pads shorthand inventory barcode item segments", () => {
  assert.deepEqual(parseAuctionInventorySearchInput("108-03-1"), {
    raw: "108-03-1",
    mode: "barcode",
    barcode: "108-03-001",
  });
});

test("parseAuctionInventorySearchInput pads control-only searches", () => {
  assert.deepEqual(parseAuctionInventorySearchInput("7"), {
    raw: "7",
    mode: "control",
    control: "0007",
  });
});

test("parseAuctionInventorySearchInput accepts barcode:control with alphanumeric barcodes", () => {
  assert.deepEqual(parseAuctionInventorySearchInput("t0-01:12"), {
    raw: "t0-01:12",
    mode: "barcode_control",
    barcode: "T0-01",
    control: "0012",
  });
});

test("parseAuctionInventorySearchInput accepts description searches", () => {
  assert.deepEqual(parseAuctionInventorySearchInput("B. BAG"), {
    raw: "B. BAG",
    mode: "description",
    description: "B. BAG",
  });
});

test("parseAuctionInventorySearchInput rejects malformed search formats", () => {
  assert.throws(
    () => parseAuctionInventorySearchInput("32-04::0001"),
    /Only one ':' is allowed/,
  );

  assert.throws(
    () => parseAuctionInventorySearchInput("32-04:"),
    /Both barcode and control are required/,
  );

  assert.throws(
    () => parseAuctionInventorySearchInput("AA-0X-12"),
    /Search must be barcode, control, barcode:control, or description/,
  );
});
