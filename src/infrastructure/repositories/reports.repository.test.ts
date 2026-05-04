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
  assert.deepEqual(rows, [
    {
      supplier_name: "BIÑAN SUPPLIER",
      supplier_code: "SUP-01",
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
            status: "PAID",
            arrival_date: new Date("2026-04-28T00:00:00.000Z"),
            due_date: new Date("2026-05-03T00:00:00.000Z"),
            duties_and_taxes: "4500.50",
            total_items: BigInt(12),
            paid_items: BigInt(9),
          },
        ];
      }) as typeof prisma.$queryRaw,
    ),
  );

  const rows = await ReportsRepository.getContainerStatusOverview("branch-1");

  assert.ok(capturedQuery);
  assert.match(capturedQuery.sql, /COUNT\(i\.inventory_id\)/);
  assert.match(capturedQuery.sql, /SUM\(CASE WHEN ai\.status = 'PAID'/);
  assert.deepEqual(rows, [
    {
      barcode: "32-04-001",
      container_number: "CN-1",
      supplier_name: "BIÑAN SUPPLIER",
      status: "PAID",
      arrival_date: new Date("2026-04-28T00:00:00.000Z"),
      due_date: new Date("2026-05-03T00:00:00.000Z"),
      duties_and_taxes: 4500.5,
      total_items: 12,
      paid_items: 9,
    },
  ]);
});
