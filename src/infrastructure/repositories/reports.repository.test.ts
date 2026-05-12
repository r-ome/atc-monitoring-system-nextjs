import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { ReportsRepository } from "./reports.repository";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("getSupplierRevenueSummary uses an aggregate query and maps numeric values", async () => {
  let capturedQuery: { sql: string } | undefined;

  restorers.push(
    patchMethod(
      prisma,
      "$queryRaw",
      (async (query: { sql: string }) => {
        capturedQuery = query;
        return [
          {
            supplier_name: "BIÑAN SUPPLIER",
            supplier_code: "SUP-01",
            sales_remittance_account: "ATC",
            container_count: BigInt(3),
            items_sold: BigInt(7),
            total_revenue: "123456.78",
          },
        ];
      }) as typeof prisma.$queryRaw,
    ),
  );

  const rows = await ReportsRepository.getSupplierRevenueSummary(
    "branch-1",
    "2026",
  );

  assert.ok(capturedQuery);
  assert.match(capturedQuery.sql, /COUNT\(DISTINCT c\.container_id\)/);
  assert.match(capturedQuery.sql, /COUNT\(ai\.auction_inventory_id\)/);
  assert.match(capturedQuery.sql, /ai\.status = 'PAID'/);
  assert.match(capturedQuery.sql, /s\.sales_remittance_account/);
  assert.deepEqual(rows, [
    {
      supplier_name: "BIÑAN SUPPLIER",
      supplier_code: "SUP-01",
      sales_remittance_account: "ATC",
      container_count: 3,
      items_sold: 7,
      total_revenue: 123456.78,
    },
  ]);
});

test("getContainerStatusOverview uses an aggregate query and maps counts", async () => {
  let capturedQuery: { sql: string } | undefined;

  restorers.push(
    patchMethod(
      prisma,
      "$queryRaw",
      (async (query: { sql: string }) => {
        capturedQuery = query;
        return [
          {
            barcode: "32-04-001",
            container_number: "CN-1",
            supplier_name: "BIÑAN SUPPLIER",
            sales_remittance_account: "ATC",
            paid_at: new Date("2026-05-01T00:00:00.000Z"),
            arrival_date: new Date("2026-04-28T00:00:00.000Z"),
            due_date: new Date("2026-05-03T00:00:00.000Z"),
            duties_and_taxes: "4500.50",
            total_items: BigInt(12),
            paid_items: BigInt(9),
            total_item_sales: "320000.00",
            total_service_charge: "16000.00",
          },
        ];
      }) as typeof prisma.$queryRaw,
    ),
  );

  const rows = await ReportsRepository.getContainerStatusOverview("branch-1");

  assert.ok(capturedQuery);
  assert.match(capturedQuery.sql, /COUNT\(i\.inventory_id\)/);
  assert.match(capturedQuery.sql, /c\.status AS paid_at/);
  assert.match(capturedQuery.sql, /SUM\(CASE WHEN ai\.status = 'PAID'/);
  assert.deepEqual(rows, [
    {
      barcode: "32-04-001",
      container_number: "CN-1",
      supplier_name: "BIÑAN SUPPLIER",
      sales_remittance_account: "ATC",
      paid_at: new Date("2026-05-01T00:00:00.000Z"),
      arrival_date: new Date("2026-04-28T00:00:00.000Z"),
      due_date: new Date("2026-05-03T00:00:00.000Z"),
      duties_and_taxes: 4500.5,
      total_items: 12,
      paid_items: 9,
      total_item_sales: 320000,
      total_service_charge: 16000,
    },
  ]);
});

test("getPaidContainerFinancials filters by paid container date and excluded barcode prefixes", async () => {
  let capturedQuery: { sql: string } | undefined;

  restorers.push(
    patchMethod(
      prisma,
      "$queryRaw",
      (async (query: { sql: string }) => {
        capturedQuery = query;
        return [
          {
            container_id: "container-1",
            barcode: "32-04",
            paid_at: new Date("2026-05-04T00:00:00.000Z"),
            total_item_sales: "800000.00",
            total_service_charge: "40000.00",
          },
        ];
      }) as typeof prisma.$queryRaw,
    ),
  );

  const rows = await ReportsRepository.getPaidContainerFinancials(
    "branch-1",
    "2026-04",
  );

  assert.ok(capturedQuery);
  assert.match(capturedQuery.sql, /c\.status AS paid_at/);
  assert.match(capturedQuery.sql, /c\.barcode/);
  assert.match(capturedQuery.sql, /c\.status IS NOT NULL/);
  assert.match(capturedQuery.sql, /c\.status >=/);
  assert.match(capturedQuery.sql, /c\.status </);
  assert.match(capturedQuery.sql, /c\.barcode NOT LIKE '00%'/);
  assert.match(capturedQuery.sql, /UPPER\(c\.barcode\) NOT LIKE 'T0%'/);
  assert.doesNotMatch(capturedQuery.sql, /bought_items_profit_loss/);
  assert.deepEqual(rows, [
    {
      container_id: "container-1",
      barcode: "32-04",
      paid_at: new Date("2026-05-04T00:00:00.000Z"),
      total_item_sales: 800000,
      total_service_charge: 40000,
    },
  ]);
});

test("getPaidContainerFinancials service charge only uses paid auction items", async () => {
  let capturedQuery: { sql: string } | undefined;

  restorers.push(
    patchMethod(
      prisma,
      "$queryRaw",
      (async (query: { sql: string }) => {
        capturedQuery = query;
        return [];
      }) as typeof prisma.$queryRaw,
    ),
  );

  await ReportsRepository.getPaidContainerFinancials("branch-1", "2026");

  assert.ok(capturedQuery);
  assert.match(
    capturedQuery.sql,
    /SUM\(CASE WHEN ai\.status = 'PAID' THEN ai\.price \* ab\.service_charge \/ 100\.0 ELSE 0 END\)/,
  );
  assert.match(
    capturedQuery.sql,
    /SUM\(CASE WHEN ai\.status = 'PAID' THEN ai\.price ELSE 0 END\)/,
  );
});

test("getBoughtItemLossEvents returns declared prices keyed by container PAID date", async () => {
  let capturedQuery: { sql: string } | undefined;

  restorers.push(
    patchMethod(
      prisma,
      "$queryRaw",
      (async (query: { sql: string }) => {
        capturedQuery = query;
        return [
          {
            container_id: "container-1",
            barcode: "32-04",
            paid_at: new Date("2026-04-16T00:00:00.000Z"),
            declared_price: "100.00",
          },
          {
            container_id: "container-1",
            barcode: "32-04",
            paid_at: new Date("2026-04-16T00:00:00.000Z"),
            declared_price: "250",
          },
        ];
      }) as typeof prisma.$queryRaw,
    ),
  );

  const rows = await ReportsRepository.getBoughtItemLossEvents(
    "branch-1",
    "2026-04",
  );

  assert.ok(capturedQuery);
  assert.match(capturedQuery.sql, /i\.is_bought_item IS NOT NULL/);
  assert.match(capturedQuery.sql, /c\.status AS paid_at/);
  assert.match(capturedQuery.sql, /c\.status IS NOT NULL/);
  assert.match(capturedQuery.sql, /c\.barcode NOT LIKE '00%'/);
  assert.match(capturedQuery.sql, /UPPER\(c\.barcode\) NOT LIKE 'T0%'/);
  assert.deepEqual(rows, [
    {
      container_id: "container-1",
      barcode: "32-04",
      paid_at: new Date("2026-04-16T00:00:00.000Z"),
      declared_price: 100,
    },
    {
      container_id: "container-1",
      barcode: "32-04",
      paid_at: new Date("2026-04-16T00:00:00.000Z"),
      declared_price: 250,
    },
  ]);
});

test("getBoughtItemGainEvents returns PAID resale prices keyed by auction_date", async () => {
  let capturedQuery: { sql: string } | undefined;

  restorers.push(
    patchMethod(
      prisma,
      "$queryRaw",
      (async (query: { sql: string }) => {
        capturedQuery = query;
        return [
          {
            container_id: "container-1",
            barcode: "32-04",
            auction_date: new Date("2026-07-04T00:00:00.000Z"),
            price: "500",
          },
        ];
      }) as typeof prisma.$queryRaw,
    ),
  );

  const rows = await ReportsRepository.getBoughtItemGainEvents(
    "branch-1",
    "2026",
  );

  assert.ok(capturedQuery);
  assert.match(capturedQuery.sql, /ai\.status = 'PAID'/);
  assert.match(capturedQuery.sql, /i\.is_bought_item IS NOT NULL/);
  assert.match(capturedQuery.sql, /ai\.auction_date >=/);
  assert.match(capturedQuery.sql, /ai\.auction_date </);
  assert.match(capturedQuery.sql, /c\.barcode NOT LIKE '00%'/);
  assert.match(capturedQuery.sql, /UPPER\(c\.barcode\) NOT LIKE 'T0%'/);
  assert.deepEqual(rows, [
    {
      container_id: "container-1",
      barcode: "32-04",
      auction_date: new Date("2026-07-04T00:00:00.000Z"),
      price: 500,
    },
  ]);
});

test("getOwnerOrganicSales returns 00/T0 PAID resales keyed by auction_date", async () => {
  let capturedQuery: { sql: string } | undefined;

  restorers.push(
    patchMethod(
      prisma,
      "$queryRaw",
      (async (query: { sql: string }) => {
        capturedQuery = query;
        return [
          {
            container_id: "container-owner-1",
            barcode: "00-08",
            auction_date: new Date("2026-06-15T00:00:00.000Z"),
            price: "350",
          },
        ];
      }) as typeof prisma.$queryRaw,
    ),
  );

  const rows = await ReportsRepository.getOwnerOrganicSales(
    "branch-1",
    "2026",
  );

  assert.ok(capturedQuery);
  assert.match(capturedQuery.sql, /ai\.status = 'PAID'/);
  assert.match(capturedQuery.sql, /ai\.auction_date >=/);
  assert.match(capturedQuery.sql, /ai\.auction_date </);
  assert.match(
    capturedQuery.sql,
    /c\.barcode LIKE '00%' OR UPPER\(c\.barcode\) LIKE 'T0%'/,
  );
  assert.deepEqual(rows, [
    {
      container_id: "container-owner-1",
      barcode: "00-08",
      auction_date: new Date("2026-06-15T00:00:00.000Z"),
      price: 350,
    },
  ]);
});
