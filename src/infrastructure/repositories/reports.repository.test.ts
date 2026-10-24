import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { ReportsRepository } from "./reports.repository";
import { patchMethod } from "src/test-utils/patch";
import { Prisma } from "@prisma/client";

const restorers: Array<() => void> = [];

test("auction branch comparison scopes one query and keeps bidder fees separate from item totals", async () => {
  let captured: Prisma.Sql | undefined;
  let reads = 0;
  restorers.push(patchMethod(prisma, "$queryRaw", (async (query: Prisma.Sql) => {
    captured = query;
    reads++;
    return [{ branch_id: "branch-1", auction_id: "auction-1", auction_date: new Date("2026-05-01T00:00:00Z"),
      total_sales: "1234.50", items_sold: BigInt(2), registered_bidders: BigInt(3),
      total_registration_fee: "60.25", highest_item_sold: "1000.00" }];
  }) as typeof prisma.$queryRaw));
  const result = await ReportsRepository.getAuctionBranchComparison(["branch-1", "branch-2"], "2026");
  assert.equal(reads, 1);
  assert.ok(captured);
  assert.deepEqual(captured.values, ["branch-1", "branch-2", new Date("2025-12-31T16:00:00Z"), new Date("2026-12-31T16:00:00Z")]);
  assert.match(captured.sql, /b\.deleted_at IS NULL/);
  assert.match(captured.sql, /b\.name <> 'ALL'/);
  assert.equal(captured.sql.match(/INNER JOIN scoped_auctions/g)?.length, 2);
  const bidderAggregate = captured.sql.split("bidder_totals AS (")[1].split("item_totals AS (")[0];
  assert.match(bidderAggregate, /COUNT\(DISTINCT ab\.bidder_id\)/);
  assert.match(bidderAggregate, /SUM\(ab\.registration_fee\)/);
  assert.doesNotMatch(bidderAggregate, /auctions_inventories/);
  assert.match(captured.sql, /ai\.status = 'PAID'/);
  assert.match(captured.sql, /ai\.deleted_at IS NULL AND ab\.deleted_at IS NULL/);
  assert.match(captured.sql, /LEFT JOIN bidder_totals/);
  assert.match(captured.sql, /LEFT JOIN item_totals/);
  assert.deepEqual(result, [{ branch_id: "branch-1", auction_id: "auction-1", auction_date: new Date("2026-05-01T00:00:00Z"),
    total_sales: 1234.5, items_sold: 2, registered_bidders: 3, total_registration_fee: 60.25, highest_item_sold: 1000 }]);
  assert.deepEqual(await ReportsRepository.getAuctionBranchComparison([], "2026"), []);
  assert.equal(reads, 1);
});

test("selected branch and comparison use the same Manila year range", async () => {
  const queries: Prisma.Sql[] = [];
  restorers.push(patchMethod(prisma, "$queryRaw", (async (query: Prisma.Sql) => {
    queries.push(query);
    return [];
  }) as typeof prisma.$queryRaw));
  await ReportsRepository.getAuctionKpis("branch-1", "2026");
  await ReportsRepository.getAuctionBranchComparison(["branch-1"], "2026");
  assert.deepEqual(queries[0].values.slice(6, 9), queries[1].values);
});

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

for (const method of ["getTotalSales", "getAuctionKpis"] as const) {
  test(`${method} scopes both aggregates with the outer branch and date range`, async () => {
    let query: Prisma.Sql | undefined;
    restorers.push(patchMethod(prisma, "$queryRaw", (async (sql: Prisma.Sql) => {
      query = sql;
      return [];
    }) as typeof prisma.$queryRaw));
    assert.deepEqual(await ReportsRepository[method]("branch-1", "2026"), []);
    assert.ok(query);
    assert.equal(query.values.length, 9);
    assert.deepEqual(query.values.slice(0, 3), query.values.slice(6, 9));
    assert.deepEqual(query.values.slice(3, 6), query.values.slice(6, 9));
    assert.equal(query.values[0], "branch-1");
    const aggregates = query.sql.split("LEFT JOIN (").slice(1);
    assert.equal(aggregates.length, 2);
    for (const aggregate of aggregates) {
      const beforeGrouping = aggregate.split("GROUP BY ab.auction_id")[0];
      assert.match(beforeGrouping, /report_auction\.branch_id = \?/);
      assert.match(beforeGrouping, /report_auction\.created_at >= \?/);
      assert.match(beforeGrouping, /report_auction\.created_at < \?/);
      assert.match(beforeGrouping, /report_auction\.deleted_at IS NULL/);
    }
    assert.match(query.sql, /COALESCE\(item_totals\.total_sales, 0\)/);
  });
}

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
    /SUM\(CASE WHEN ai\.status = 'PAID' AND i\.sales_allocation <> 'ATC' THEN ai\.price \* ab\.service_charge \/ 100\.0 ELSE 0 END\)/,
  );
  assert.match(
    capturedQuery.sql,
    /SUM\(CASE WHEN ai\.status = 'PAID' AND i\.sales_allocation <> 'ATC' THEN ai\.price ELSE 0 END\)/,
  );
});

test("getBoughtItemLossEvents returns paid bought-item cash out keyed by payment date", async () => {
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
            event_date: new Date("2026-04-16T00:00:00.000Z"),
            amount: "100.00",
          },
          {
            container_id: "container-1",
            barcode: "32-04",
            event_date: new Date("2026-04-16T00:00:00.000Z"),
            amount: "250",
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
  assert.match(capturedQuery.sql, /COALESCE\(rr\.created_at, ai\.auction_date\) AS event_date/);
  assert.match(capturedQuery.sql, /ai\.status = 'PAID'/);
  assert.match(capturedQuery.sql, /ai\.manifest_number = 'BOUGHT ITEM'/);
  assert.match(capturedQuery.sql, /LEFT JOIN receipt_records rr/);
  assert.match(capturedQuery.sql, /c\.barcode NOT LIKE '00%'/);
  assert.match(capturedQuery.sql, /UPPER\(c\.barcode\) NOT LIKE 'T0%'/);
  assert.deepEqual(rows, [
    {
      container_id: "container-1",
      barcode: "32-04",
      event_date: new Date("2026-04-16T00:00:00.000Z"),
      amount: 100,
    },
    {
      container_id: "container-1",
      barcode: "32-04",
      event_date: new Date("2026-04-16T00:00:00.000Z"),
      amount: 250,
    },
  ]);
});

test("getBoughtItemGainEvents returns paid resale cash in keyed by payment date", async () => {
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
            event_date: new Date("2026-07-04T00:00:00.000Z"),
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
  assert.match(
    capturedQuery.sql,
    /ai\.manifest_number IS NULL OR ai\.manifest_number <> 'BOUGHT ITEM'/,
  );
  assert.match(capturedQuery.sql, /COALESCE\(rr\.created_at, ai\.auction_date\) AS event_date/);
  assert.match(capturedQuery.sql, /LEFT JOIN receipt_records rr/);
  assert.match(capturedQuery.sql, /c\.barcode NOT LIKE '00%'/);
  assert.match(capturedQuery.sql, /UPPER\(c\.barcode\) NOT LIKE 'T0%'/);
  assert.deepEqual(rows, [
    {
      container_id: "container-1",
      barcode: "32-04",
      event_date: new Date("2026-07-04T00:00:00.000Z"),
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
    /c\.barcode LIKE '00%'\s+OR UPPER\(c\.barcode\) LIKE 'T0%'\s+OR \(\s+i\.sales_allocation = 'ATC'/,
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
