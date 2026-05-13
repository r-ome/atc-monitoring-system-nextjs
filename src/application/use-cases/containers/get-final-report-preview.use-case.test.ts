import test from "node:test";
import assert from "node:assert/strict";
import { getFinalReportPreviewUseCase } from "./get-final-report-preview.use-case";
import {
  AuctionRepository,
  ContainerRepository,
} from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";
import { emptyFinalReportDraft } from "src/entities/models/FinalReportDraft";

const date = new Date("2026-05-07T00:00:00.000Z");

const buildContainer = () =>
  ({
    container_id: "container-1",
    barcode: "32-04",
    branch: { branch_id: "branch-1", name: "BINAN" },
    supplier: {
      supplier_id: "supplier-1",
      name: "Supplier",
      sales_remittance_account: "ATC",
    },
    inventories: [
      {
        inventory_id: "unsold-1",
        container_id: "container-1",
        barcode: "32-04-001",
        control: "0001",
        description: "BAG",
        status: "UNSOLD",
        is_bought_item: 0,
        auction_date: null,
        created_at: date,
        updated_at: date,
        deleted_at: null,
        histories: [],
        auctions_inventory: null,
      },
      {
        inventory_id: "monitoring-source-1",
        container_id: "container-1",
        barcode: "32-04",
        control: "0001",
        description: "BAG",
        status: "SOLD",
        is_bought_item: 0,
        auction_date: date,
        created_at: date,
        updated_at: date,
        deleted_at: null,
        histories: [],
        auctions_inventory: {
          auction_inventory_id: "auction-inventory-1",
          auction_bidder_id: "ab-1",
          inventory_id: "monitoring-source-1",
          description: "BAG",
          status: "UNPAID",
          price: 500,
          qty: "1",
          manifest_number: "M1",
          is_slash_item: null,
          auction_date: date,
          auction_bidder: {
            auction_id: "auction-1",
            bidder: {
              bidder_id: "bidder-1",
              bidder_number: "0001",
              first_name: "F",
              middle_name: null,
              last_name: "L",
            },
          },
          histories: [],
        },
      },
      {
        inventory_id: "monitoring-source-2",
        container_id: "container-1",
        barcode: "32-04",
        control: "0002",
        description: "BAG",
        status: "SOLD",
        is_bought_item: 0,
        auction_date: date,
        created_at: date,
        updated_at: date,
        deleted_at: null,
        histories: [],
        auctions_inventory: {
          auction_inventory_id: "auction-inventory-2",
          auction_bidder_id: "ab-2",
          inventory_id: "monitoring-source-2",
          description: "BAG",
          status: "REFUNDED",
          price: 700,
          qty: "1",
          manifest_number: "M2",
          is_slash_item: null,
          auction_date: date,
          auction_bidder: {
            auction_id: "auction-2",
            bidder: {
              bidder_id: "bidder-2",
              bidder_number: "0740",
              first_name: "F",
              middle_name: null,
              last_name: "L",
            },
          },
          histories: [],
        },
      },
    ],
  }) as never;

test("getFinalReportPreviewUseCase auto-resolves exact two-part monitoring matches", async () => {
  const restoreContainer = patchMethod(
    ContainerRepository,
    "getContainerFinalReportData",
    async () => buildContainer(),
  );
  const restoreDraft = patchMethod(
    ContainerRepository,
    "getFinalReportDraft",
    async () => null,
  );
  const restoreCounterCheck = patchMethod(
    AuctionRepository,
    "getCounterCheckRecords",
    async () => [],
  );
  const restoreTax = patchMethod(
    ContainerRepository,
    "getContainerTaxDeduction",
    async () => null,
  );

  try {
    const preview = await getFinalReportPreviewUseCase({
      barcode: "32-04",
      selected_dates: ["May 07, 2026"],
      exclude_bidder_740: false,
      exclude_refunded_bidder_5013: false,
      deduct_thirty_k: false,
    });

    assert.equal(preview.auto_resolved.length, 1);
    assert.equal(preview.auto_resolved[0].unsold_item.barcode, "32-04-001");
    assert.equal(
      preview.auto_resolved[0].monitoring_item.auction_inventory_id,
      "auction-inventory-1",
    );
    assert.deepEqual(preview.warehouse_check_items, []);
  } finally {
    restoreTax();
    restoreCounterCheck();
    restoreDraft();
    restoreContainer();
  }
});

test("getFinalReportPreviewUseCase applies staged manual merges virtually", async () => {
  const restoreContainer = patchMethod(
    ContainerRepository,
    "getContainerFinalReportData",
    async () => buildContainer(),
  );
  const restoreDraft = patchMethod(
    ContainerRepository,
    "getFinalReportDraft",
    async () => ({
      ...emptyFinalReportDraft({
        selected_dates: ["May 07, 2026"],
        exclude_bidder_740: false,
        exclude_refunded_bidder_5013: false,
        deduct_thirty_k: false,
      }),
      merged_inventories: [
        {
          old_inventory_id: "monitoring-source-1",
          new_inventory_id: "unsold-1",
        },
      ],
    }),
  );
  const restoreCounterCheck = patchMethod(
    AuctionRepository,
    "getCounterCheckRecords",
    async () => [],
  );
  const restoreTax = patchMethod(
    ContainerRepository,
    "getContainerTaxDeduction",
    async () => null,
  );

  try {
    const preview = await getFinalReportPreviewUseCase({
      barcode: "32-04",
      selected_dates: ["May 07, 2026"],
      exclude_bidder_740: false,
      exclude_refunded_bidder_5013: false,
      deduct_thirty_k: false,
    });

    assert.equal(preview.unsold_items.length, 0);
    assert.equal(preview.auto_resolved.length, 0);
    assert.equal(preview.report.monitoring[0].inventory_id, "unsold-1");
    assert.equal(preview.report.monitoring[0].barcode, "32-04-001");
    assert.equal(preview.report.monitoring[0].control, "0001");
  } finally {
    restoreTax();
    restoreCounterCheck();
    restoreDraft();
    restoreContainer();
  }
});

test("getFinalReportPreviewUseCase moves excluded bidder 740 rows to deductions", async () => {
  const restoreContainer = patchMethod(
    ContainerRepository,
    "getContainerFinalReportData",
    async () => buildContainer(),
  );
  const restoreDraft = patchMethod(
    ContainerRepository,
    "getFinalReportDraft",
    async () => null,
  );
  const restoreCounterCheck = patchMethod(
    AuctionRepository,
    "getCounterCheckRecords",
    async () => [],
  );
  const restoreTax = patchMethod(
    ContainerRepository,
    "getContainerTaxDeduction",
    async () => null,
  );

  try {
    const preview = await getFinalReportPreviewUseCase({
      barcode: "32-04",
      selected_dates: ["May 07, 2026"],
      exclude_bidder_740: true,
      exclude_refunded_bidder_5013: false,
      deduct_thirty_k: false,
    });

    assert.equal(
      preview.report.monitoring.some(
        (item) => item.bidder_number === "0740" && item.auction_status === "REFUNDED",
      ),
      false,
    );
    assert.deepEqual(preview.report.deductions, [
      {
        control: "0002",
        description: "BAG",
        bidder_number: "0740",
        original_price: 700,
        deducted_amount: 700,
      },
    ]);
  } finally {
    restoreTax();
    restoreCounterCheck();
    restoreDraft();
    restoreContainer();
  }
});

test("getFinalReportPreviewUseCase includes refunded non-5013 rows in UNSOLD review", async () => {
  const container = buildContainer() as {
    inventories: Array<Record<string, unknown>>;
  };
  container.inventories.push(
    {
      inventory_id: "refunded-review-1",
      container_id: "container-1",
      barcode: "32-04-002",
      control: "0002",
      description: "REFUNDED BAG",
      status: "SOLD",
      is_bought_item: 0,
      auction_date: date,
      created_at: date,
      updated_at: date,
      deleted_at: null,
      histories: [],
      auctions_inventory: {
        auction_inventory_id: "auction-inventory-refunded-review",
        auction_bidder_id: "ab-refunded-review",
        inventory_id: "refunded-review-1",
        description: "REFUNDED BAG",
        status: "REFUNDED",
        price: 900,
        qty: "1",
        manifest_number: "M3",
        is_slash_item: null,
        auction_date: date,
        auction_bidder: {
          auction_id: "auction-3",
          bidder: {
            bidder_id: "bidder-3",
            bidder_number: "0003",
            first_name: "F",
            middle_name: null,
            last_name: "L",
          },
        },
        histories: [],
      },
    },
    {
      inventory_id: "refunded-5013-1",
      container_id: "container-1",
      barcode: "32-04-003",
      control: "0003",
      description: "REFUNDED 5013 BAG",
      status: "SOLD",
      is_bought_item: 0,
      auction_date: date,
      created_at: date,
      updated_at: date,
      deleted_at: null,
      histories: [],
      auctions_inventory: {
        auction_inventory_id: "auction-inventory-refunded-5013",
        auction_bidder_id: "ab-refunded-5013",
        inventory_id: "refunded-5013-1",
        description: "REFUNDED 5013 BAG",
        status: "REFUNDED",
        price: 1000,
        qty: "1",
        manifest_number: "M4",
        is_slash_item: null,
        auction_date: date,
        auction_bidder: {
          auction_id: "auction-4",
          bidder: {
            bidder_id: "bidder-5013",
            bidder_number: "5013",
            first_name: "ATC",
            middle_name: null,
            last_name: "Account",
          },
        },
        histories: [],
      },
    },
  );
  const restoreContainer = patchMethod(
    ContainerRepository,
    "getContainerFinalReportData",
    async () => container as never,
  );
  const restoreDraft = patchMethod(
    ContainerRepository,
    "getFinalReportDraft",
    async () => null,
  );
  const restoreCounterCheck = patchMethod(
    AuctionRepository,
    "getCounterCheckRecords",
    async () => [],
  );
  const restoreTax = patchMethod(
    ContainerRepository,
    "getContainerTaxDeduction",
    async () => null,
  );

  try {
    const preview = await getFinalReportPreviewUseCase({
      barcode: "32-04",
      selected_dates: ["May 07, 2026"],
      exclude_bidder_740: false,
      exclude_refunded_bidder_5013: true,
      deduct_thirty_k: false,
    });

    assert.equal(
      preview.unsold_items.some(
        (item) => item.inventory_id === "refunded-review-1",
      ),
      true,
    );
    assert.equal(
      preview.unsold_items.some(
        (item) => item.inventory_id === "refunded-5013-1",
      ),
      false,
    );
  } finally {
    restoreTax();
    restoreCounterCheck();
    restoreDraft();
    restoreContainer();
  }
});

const buildCounterCheckOnlyContainer = () =>
  ({
    container_id: "container-2",
    barcode: "40-01",
    branch: { branch_id: "branch-1", name: "BINAN" },
    supplier: {
      supplier_id: "supplier-1",
      name: "Supplier",
      sales_remittance_account: "ATC",
    },
    inventories: [
      {
        inventory_id: "unsold-cc-1",
        container_id: "container-2",
        barcode: "40-01-005",
        control: "0099",
        description: "ASSORTED BAG",
        status: "UNSOLD",
        is_bought_item: 0,
        auction_date: null,
        created_at: date,
        updated_at: date,
        deleted_at: null,
        histories: [],
        auctions_inventory: null,
      },
      {
        inventory_id: "monitoring-source-3",
        container_id: "container-2",
        barcode: "40-01-100",
        control: "0001",
        description: "BAG",
        status: "SOLD",
        is_bought_item: 0,
        auction_date: date,
        created_at: date,
        updated_at: date,
        deleted_at: null,
        histories: [],
        auctions_inventory: {
          auction_inventory_id: "auction-inventory-3",
          auction_bidder_id: "ab-3",
          inventory_id: "monitoring-source-3",
          description: "BAG",
          status: "UNPAID",
          price: 500,
          qty: "1",
          manifest_number: "M3",
          is_slash_item: null,
          auction_date: date,
          auction_bidder: {
            auction_id: "auction-3",
            bidder: {
              bidder_id: "bidder-3",
              bidder_number: "0001",
              first_name: "F",
              middle_name: null,
              last_name: "L",
            },
          },
          histories: [],
        },
      },
    ],
  }) as never;

test("getFinalReportPreviewUseCase produces counter-check candidates when no two-part match exists", async () => {
  const restoreContainer = patchMethod(
    ContainerRepository,
    "getContainerFinalReportData",
    async () => buildCounterCheckOnlyContainer(),
  );
  const restoreDraft = patchMethod(
    ContainerRepository,
    "getFinalReportDraft",
    async () => null,
  );
  const restoreCounterCheck = patchMethod(
    AuctionRepository,
    "getCounterCheckRecords",
    async () => [
      {
        counter_check_id: "cc-1",
        auction_id: "auction-3",
        control: "0099",
        bidder_number: "5050",
        price: "1200",
        page: "1",
        description: "ASSORTED BAG",
      },
    ] as never,
  );
  const restoreTax = patchMethod(
    ContainerRepository,
    "getContainerTaxDeduction",
    async () => null,
  );

  try {
    const preview = await getFinalReportPreviewUseCase({
      barcode: "40-01",
      selected_dates: ["May 07, 2026"],
      exclude_bidder_740: false,
      exclude_refunded_bidder_5013: false,
      deduct_thirty_k: false,
    });

    assert.equal(preview.counter_check_candidates.length, 1);
    assert.equal(
      preview.counter_check_candidates[0].unsold_item.inventory_id,
      "unsold-cc-1",
    );
    assert.equal(preview.counter_check_candidates[0].matches.length, 1);
    assert.deepEqual(preview.warehouse_check_items, []);
    assert.equal(preview.decisions["unsold-cc-1"], "COUNTER_CHECK_PENDING");
  } finally {
    restoreTax();
    restoreCounterCheck();
    restoreDraft();
    restoreContainer();
  }
});

test("getFinalReportPreviewUseCase reuses persisted tax deduction when options match", async () => {
  const restoreContainer = patchMethod(
    ContainerRepository,
    "getContainerFinalReportData",
    async () => buildContainer(),
  );
  const restoreDraft = patchMethod(
    ContainerRepository,
    "getFinalReportDraft",
    async () => null,
  );
  const restoreCounterCheck = patchMethod(
    AuctionRepository,
    "getCounterCheckRecords",
    async () => [],
  );
  const restoreTax = patchMethod(
    ContainerRepository,
    "getContainerTaxDeduction",
    async () => ({
      applied_at: date.toISOString(),
      applied_by: "tester",
      options: {
        selected_dates: ["May 07, 2026"],
        exclude_bidder_740: false,
        exclude_refunded_bidder_5013: false,
      },
      items: [
        {
          control: "0001",
          description: "BAG",
          bidder_number: "0001",
          original_price: 500,
          deducted_amount: 100,
        },
      ],
    }),
  );

  try {
    const preview = await getFinalReportPreviewUseCase({
      barcode: "32-04",
      selected_dates: ["May 07, 2026"],
      exclude_bidder_740: false,
      exclude_refunded_bidder_5013: false,
      deduct_thirty_k: true,
    });

    assert.equal(preview.tax_deduction_persisted, true);
    assert.equal(preview.report.deductions.length, 1);
    const monitoringRow = preview.report.monitoring.find(
      (row) => row.auction_inventory_id === "auction-inventory-1",
    );
    assert.equal(monitoringRow?.price, 400);
  } finally {
    restoreTax();
    restoreCounterCheck();
    restoreDraft();
    restoreContainer();
  }
});

test("getFinalReportPreviewUseCase exposes decision map for matched items", async () => {
  const restoreContainer = patchMethod(
    ContainerRepository,
    "getContainerFinalReportData",
    async () => buildContainer(),
  );
  const restoreDraft = patchMethod(
    ContainerRepository,
    "getFinalReportDraft",
    async () => null,
  );
  const restoreCounterCheck = patchMethod(
    AuctionRepository,
    "getCounterCheckRecords",
    async () => [],
  );
  const restoreTax = patchMethod(
    ContainerRepository,
    "getContainerTaxDeduction",
    async () => null,
  );

  try {
    const preview = await getFinalReportPreviewUseCase({
      barcode: "32-04",
      selected_dates: ["May 07, 2026"],
      exclude_bidder_740: false,
      exclude_refunded_bidder_5013: false,
      deduct_thirty_k: false,
    });

    assert.equal(preview.decisions["unsold-1"], "MATCHED_2PART");
  } finally {
    restoreTax();
    restoreCounterCheck();
    restoreDraft();
    restoreContainer();
  }
});
