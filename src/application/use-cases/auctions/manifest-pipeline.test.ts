import test from "node:test";
import assert from "node:assert/strict";

import {
  addContainerIdForNewInventories,
  divideIntoHundreds,
  divideQuantites,
  formatControlDescriptionQty,
  formatExistingInventories,
  formatSlashedBarcodes,
  normalizeManifestDescriptions,
  removeManifestDuplicates,
  removeMonitoringDuplicates,
  validateBidders,
  validateEmptyFields,
} from "./manifest-pipeline";

test("validateEmptyFields preserves bidder requirement while defaulting missing price to zero", () => {
  const [validRow, invalidRow] = validateEmptyFields([
    {
      BARCODE: "32-04-001",
      CONTROL: "12",
      DESCRIPTION: "",
      BIDDER: "7",
      PRICE: "",
      QTY: "0.5",
      MANIFEST: " M-1 ",
    },
    {
      BARCODE: "",
      CONTROL: "",
      DESCRIPTION: "",
      BIDDER: "",
      PRICE: "",
      QTY: "",
      MANIFEST: "",
    },
  ]);

  assert.equal(validRow.isValid, true);
  assert.equal(validRow.CONTROL, "0012");
  assert.equal(validRow.BIDDER, "0007");
  assert.equal(validRow.QTY, "1/2");
  assert.equal(validRow.MANIFEST, "M-1");
  assert.equal(validRow.PRICE, "0");

  assert.equal(invalidRow.isValid, false);
  assert.equal(invalidRow.error, "Missing required fields: Barcode, Bidder");
  assert.equal(invalidRow.PRICE, "0");
});

test("formatControlDescriptionQty applies manifest defaults and normalizes padding", () => {
  const [row] = formatControlDescriptionQty([
    {
      BARCODE: "32-04",
      CONTROL: "1.2",
      DESCRIPTION: "",
      BIDDER: "7",
      PRICE: "500",
      QTY: "",
      MANIFEST: "",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
  ]);

  assert.equal(row.DESCRIPTION, "NO DESCRIPTION");
  assert.equal(row.QTY, "NO QTY");
  assert.equal(row.MANIFEST, "NO MANIFEST");
  assert.equal(row.CONTROL, "0012");
  assert.equal(row.BIDDER, "0007");
});

test("normalizeManifestDescriptions applies safe formatting fixes and records a warning", () => {
  const [row] = normalizeManifestDescriptions([
    {
      BARCODE: "32-04",
      CONTROL: "0012",
      DESCRIPTION: "  toys asis  ",
      BIDDER: "0007",
      PRICE: "500",
      QTY: "1",
      MANIFEST: "M-1",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
  ]);

  assert.equal(row.DESCRIPTION, "toys AS IS");
  assert.equal(
    row.warning,
    'Normalized description from "  toys asis  " to "toys AS IS".',
  );
});

test("normalizeManifestDescriptions keeps valid rows insertable while warning on likely typos", () => {
  const [row] = normalizeManifestDescriptions([
    {
      BARCODE: "32-04",
      CONTROL: "0012",
      DESCRIPTION: "FIOSHING ROD DI",
      BIDDER: "0007",
      PRICE: "500",
      QTY: "1",
      MANIFEST: "M-1",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
  ]);

  assert.equal(row.DESCRIPTION, "FIOSHING ROD DI");
  assert.equal(row.isValid, true);
  assert.equal(
    row.warning,
    'Possible typo: "FIOSHING". Consider "FISHING".',
  );
});

test("divideIntoHundreds keeps total intact while rounding to the nearest hundred", () => {
  assert.deepEqual(divideIntoHundreds(1000, 3), [300, 300, 400]);
  assert.deepEqual(divideIntoHundreds(250, 2), [100, 150]);
});

test("divideQuantites preserves LOT/SET text and distributes counted quantities", () => {
  assert.deepEqual(divideQuantites("5 PCS", 2), ["3 PCS", "2 PCS"]);
  assert.deepEqual(divideQuantites("1 BOX", 3), ["1 BOX", "1 BOX", "1 BOX"]);
  assert.deepEqual(divideQuantites("LOT", 2), ["LOT", "LOT"]);
});

test("formatSlashedBarcodes expands slash rows into individual logical items", () => {
  const rows = formatSlashedBarcodes([
    {
      BARCODE: "32-04-001/002/32-04-003",
      CONTROL: "1/40",
      DESCRIPTION: "VASE",
      BIDDER: "0007",
      PRICE: "1000",
      QTY: "3 PCS",
      MANIFEST: "M-1",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
  ]);

  assert.equal(rows.length, 3);
  assert.deepEqual(
    rows.map((row) => row.BARCODE),
    ["32-04-001", "32-04-002", "32-04-003"],
  );
  assert.deepEqual(
    rows.map((row) => row.PRICE),
    ["300", "300", "400"],
  );
  assert.deepEqual(
    rows.map((row) => row.QTY),
    ["1 PCS", "1 PCS", "1 PCS"],
  );
  assert.deepEqual(
    rows.map((row) => row.CONTROL),
    ["0001", "0040", "0040"],
  );
  assert.ok(rows.every((row) => row.isSlashItem));
  assert.equal(new Set(rows.map((row) => row.isSlashItem)).size, 1);
});

test("removeManifestDuplicates uses barcode-only keys for three-part barcodes and barcode-control for two-part ones", () => {
  const rows = removeManifestDuplicates([
    {
      BARCODE: "32-04-001",
      CONTROL: "0001",
      DESCRIPTION: "A",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
    {
      BARCODE: "32-04-001",
      CONTROL: "0002",
      DESCRIPTION: "B",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
    {
      BARCODE: "32-04",
      CONTROL: "0003",
      DESCRIPTION: "C",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
    {
      BARCODE: "32-04",
      CONTROL: "0003",
      DESCRIPTION: "D",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
  ]);

  assert.equal(rows[1].error, "Duplicate barcode in uploaded file: 32-04-001");
  assert.equal(
    rows[3].error,
    "Duplicate barcode/control in uploaded file: 32-04 / 0003",
  );
});

test("validateBidders rejects unregistered or banned bidders and attaches auction bidder metadata for valid rows", () => {
  const [validRow, bannedRow, missingRow] = validateBidders(
    [
      {
        BARCODE: "32-04-001",
        CONTROL: "0001",
        DESCRIPTION: "A",
        BIDDER: "0007",
        PRICE: "100",
        QTY: "1",
        MANIFEST: "M",
        isValid: true,
        error: "",
        forUpdating: false,
        isSlashItem: "",
      },
      {
        BARCODE: "32-04-002",
        CONTROL: "0001",
        DESCRIPTION: "B",
        BIDDER: "0008",
        PRICE: "100",
        QTY: "1",
        MANIFEST: "M",
        isValid: true,
        error: "",
        forUpdating: false,
        isSlashItem: "",
      },
      {
        BARCODE: "32-04-003",
        CONTROL: "0001",
        DESCRIPTION: "C",
        BIDDER: "0009",
        PRICE: "100",
        QTY: "1",
        MANIFEST: "M",
        isValid: true,
        error: "",
        forUpdating: false,
        isSlashItem: "",
      },
    ],
    [
      {
        auction_bidder_id: "ab-1",
        service_charge: 12,
        bidder: { bidder_number: "0007", status: "ACTIVE" },
      },
      {
        auction_bidder_id: "ab-2",
        service_charge: 15,
        bidder: { bidder_number: "0008", status: "BANNED" },
      },
    ] as never,
  );

  assert.equal(validRow.auction_bidder_id, "ab-1");
  assert.equal(validRow.service_charge, 12);
  assert.equal(bannedRow.error, "0008 is banned");
  assert.equal(
    missingRow.error,
    "Bidder #0009 is not registered in this auction",
  );
});

test("formatExistingInventories blocks sold items, allows reuse, and tightens bought-item uploads to UNSOLD inventory", () => {
  const baseRows = [
    {
      BARCODE: "32-04-001",
      CONTROL: "0001",
      DESCRIPTION: "A",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
    {
      BARCODE: "32-04",
      CONTROL: "0002",
      DESCRIPTION: "B",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
    {
      BARCODE: "32-05-001",
      CONTROL: "0001",
      DESCRIPTION: "C",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
      forUpdating: false,
      isSlashItem: "",
    },
  ];

  const inventories = [
    {
      inventory_id: "inv-sold",
      container_id: "container-1",
      barcode: "32-04-001",
      control: "0001",
      status: "SOLD",
      auction_date: new Date("2026-04-25T00:00:00.000Z"),
      auctions_inventory: {
        auction_bidder: {
          auction_id: "auction-previous",
          bidder: {
            bidder_number: "0007",
          },
        },
      },
    },
    {
      inventory_id: "inv-unsold",
      container_id: "container-2",
      barcode: "32-04",
      control: "0002",
      status: "UNSOLD",
    },
    {
      inventory_id: "inv-bought",
      container_id: "container-3",
      barcode: "32-05-001",
      control: "0001",
      status: "BOUGHT_ITEM",
      auction_date: new Date("2026-05-02T00:00:00.000Z"),
      auctions_inventory: {
        auction_bidder: {
          auction_id: "auction-current",
          bidder: {
            bidder_number: "5013",
          },
        },
      },
    },
  ];

  const normalMode = formatExistingInventories(baseRows, inventories as never);
  assert.equal(
    normalMode[0].error,
    "Already encoded to #0007 on Apr 25, 2026",
  );
  assert.equal(normalMode[1].forUpdating, true);
  assert.equal(normalMode[1].inventory_id, "inv-unsold");
  assert.equal(normalMode[2].forUpdating, true);

  const boughtMode = formatExistingInventories(
    baseRows,
    inventories as never,
    true,
    "auction-previous",
  );
  assert.equal(
    boughtMode[2].error,
    "Already encoded as Bought Item on May 02, 2026",
  );

  const sameAuctionBoughtMode = formatExistingInventories(
    baseRows,
    inventories as never,
    true,
    "auction-current",
  );
  assert.equal(
    sameAuctionBoughtMode[2].error,
    "DOUBLE ENCODE: already uploaded as Bought Item in this auction",
  );
});

test("addContainerIdForNewInventories resolves container ids from barcode prefixes and flags unknown containers", () => {
  const [matchedRow, missingRow] = addContainerIdForNewInventories(
    [
      {
        BARCODE: "32-04-001",
        CONTROL: "0001",
        DESCRIPTION: "A",
        BIDDER: "0001",
        PRICE: "100",
        QTY: "1",
        MANIFEST: "M",
        isValid: true,
        error: "",
        forUpdating: false,
        isSlashItem: "",
      },
      {
        BARCODE: "99-01-001",
        CONTROL: "0001",
        DESCRIPTION: "B",
        BIDDER: "0001",
        PRICE: "100",
        QTY: "1",
        MANIFEST: "M",
        isValid: true,
        error: "",
        forUpdating: false,
        isSlashItem: "",
      },
    ],
    [{ container_id: "container-1", barcode: "32-04" }] as never,
  );

  assert.equal(matchedRow.container_id, "container-1");
  assert.equal(missingRow.error, "Container 99-01 does not exist");
});

test("removeMonitoringDuplicates enforces cross-auction duplicate protection while allowing re-encode cases", () => {
  const rows = [
    {
      BARCODE: "32-04-001",
      CONTROL: "0001",
      DESCRIPTION: "A",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
        forUpdating: false,
      isSlashItem: "",
    },
    {
      BARCODE: "32-04-002",
      CONTROL: "0001",
      DESCRIPTION: "B",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
        forUpdating: false,
      isSlashItem: "",
    },
    {
      BARCODE: "32-04-003",
      CONTROL: "0001",
      DESCRIPTION: "C",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
        forUpdating: false,
      isSlashItem: "",
    },
    {
      BARCODE: "32-04-004",
      CONTROL: "0001",
      DESCRIPTION: "D",
      BIDDER: "0001",
      PRICE: "100",
      QTY: "1",
      MANIFEST: "M",
      isValid: true,
      error: "",
        forUpdating: false,
      isSlashItem: "",
    },
  ];

  const monitoring = [
    {
      auction_inventory_id: "ai-active",
      status: "UNPAID",
      auction_date: new Date("2026-05-02T00:00:00.000Z"),
      inventory_id: "inv-1",
      inventory: { barcode: "32-04-001", control: "0001", status: "SOLD" },
      auction_bidder: {
        auction_id: "auction-previous",
        bidder: { bidder_number: "0001" },
      },
    },
    {
      auction_inventory_id: "ai-cancelled",
      status: "CANCELLED",
      auction_date: new Date("2026-05-02T00:00:00.000Z"),
      inventory_id: "inv-2",
      inventory: { barcode: "32-04-002", control: "0001", status: "UNSOLD" },
      auction_bidder: {
        auction_id: "auction-previous",
        bidder: { bidder_number: "0001" },
      },
    },
    {
      auction_inventory_id: "ai-bought",
      status: "PAID",
      auction_date: new Date("2026-05-02T00:00:00.000Z"),
      inventory_id: "inv-3",
      inventory: { barcode: "32-04-003", control: "0001", status: "BOUGHT_ITEM" },
      auction_bidder: {
        auction_id: "auction-current",
        bidder: { bidder_number: "5013" },
      },
    },
  ];

  const normalMode = removeMonitoringDuplicates(
    rows,
    monitoring as never,
    false,
    "auction-current",
  );
  assert.equal(
    normalMode[0].error,
    "Already encoded to #0001 on May 02, 2026",
  );
  assert.equal(normalMode[1].forUpdating, true);
  assert.equal(normalMode[1].auction_inventory_id, "ai-cancelled");
  assert.equal(normalMode[2].forUpdating, true);
  assert.equal(normalMode[2].auction_inventory_id, "ai-bought");
  assert.equal(normalMode[3].isValid, true);

  const boughtMode = removeMonitoringDuplicates(
    rows,
    monitoring as never,
    true,
    "auction-current",
  );
  assert.equal(
    boughtMode[2].error,
    "DOUBLE ENCODE: already encoded to #5013 on May 02, 2026",
  );
});
