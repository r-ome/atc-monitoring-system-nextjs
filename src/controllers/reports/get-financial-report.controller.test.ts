import test from "node:test";
import assert from "node:assert/strict";

import { presentSalesExpensesSummary } from "./get-financial-report.controller";

test("presentSalesExpensesSummary totals income, expenses, and net income", () => {
  const result = presentSalesExpensesSummary(
    [
      {
        container_id: "container-1",
        barcode: "32-04",
        paid_at: new Date("2026-05-04T00:00:00.000Z"),
        total_item_sales: 800000,
        total_service_charge: 40000,
        bought_items_profit_loss: 0,
      },
    ],
    [
      {
        created_at: new Date("2026-05-04T10:00:00.000Z"),
        total_amount: 5000,
      },
    ],
    "daily",
  );

  assert.deepEqual(result.totals, {
    sales_commission: 120000,
    service_charge: 40000,
    bought_items_profit_loss: 0,
    sorting_preparation_fee: 40000,
    total_income: 200000,
    expenses: 5000,
    atc_group_commission: 40000,
    royalty: 35000,
    total_expenses: 80000,
    net_income: 120000,
  });
  assert.deepEqual(result.breakdown, [
    {
      key: "2026-05-04",
      period: "May 04, 2026",
      sales_commission: 120000,
      service_charge: 40000,
      bought_items_profit_loss: 0,
      sorting_preparation_fee: 40000,
      total_income: 200000,
      expenses: 5000,
      atc_group_commission: 40000,
      royalty: 35000,
      total_expenses: 80000,
      net_income: 120000,
      paid_containers: [
        {
          barcode: "32-04",
          total_item_sales: 800000,
          total_service_charge: 40000,
        },
      ],
    },
  ]);
});

test("presentSalesExpensesSummary exposes only the requested income and expense columns", () => {
  const result = presentSalesExpensesSummary(
    [
      {
        container_id: "container-1",
        barcode: "32-04",
        paid_at: new Date("2026-05-04T00:00:00.000Z"),
        total_item_sales: 100000,
        total_service_charge: 5000,
        bought_items_profit_loss: 0,
      },
    ],
    [],
    "daily",
  );

  assert.deepEqual(Object.keys(result.breakdown[0]), [
    "key",
    "period",
    "total_income",
    "sales_commission",
    "service_charge",
    "bought_items_profit_loss",
    "sorting_preparation_fee",
    "total_expenses",
    "expenses",
    "atc_group_commission",
    "royalty",
    "net_income",
    "paid_containers",
  ]);
});

test("presentSalesExpensesSummary adds bought item profit or loss to income and net income", () => {
  const result = presentSalesExpensesSummary(
    [
      {
        container_id: "container-1",
        barcode: "32-04",
        paid_at: new Date("2026-05-04T00:00:00.000Z"),
        total_item_sales: 100000,
        total_service_charge: 5000,
        bought_items_profit_loss: -3000,
      },
      {
        container_id: "container-2",
        barcode: "32-05",
        paid_at: new Date("2026-05-04T00:00:00.000Z"),
        total_item_sales: 200000,
        total_service_charge: 10000,
        bought_items_profit_loss: 8000,
      },
    ],
    [
      {
        created_at: new Date("2026-05-04T10:00:00.000Z"),
        total_amount: 7000,
      },
    ],
    "daily",
  );

  assert.equal(result.breakdown[0].bought_items_profit_loss, 5000);
  assert.equal(result.breakdown[0].total_income, 110000);
  assert.equal(result.breakdown[0].net_income, 38000);
  assert.equal(result.totals.bought_items_profit_loss, 5000);
  assert.equal(result.totals.total_income, 110000);
  assert.equal(result.totals.net_income, 38000);
});

test("presentSalesExpensesSummary daily buckets merge expense-only and container-only periods", () => {
  const result = presentSalesExpensesSummary(
    [
      {
        container_id: "container-1",
        barcode: "32-04",
        paid_at: new Date("2026-05-04T00:00:00.000Z"),
        total_item_sales: 100000,
        total_service_charge: 5000,
        bought_items_profit_loss: 0,
      },
    ],
    [
      {
        created_at: new Date("2026-05-05T10:00:00.000Z"),
        total_amount: 7000,
      },
    ],
    "daily",
  );

  assert.equal(result.breakdown.length, 2);
  assert.equal(result.breakdown[0].key, "2026-05-04");
  assert.deepEqual(result.breakdown[0].paid_containers, [
    {
      barcode: "32-04",
      total_item_sales: 100000,
      total_service_charge: 5000,
    },
  ]);
  assert.equal(result.breakdown[0].total_income, 35000);
  assert.equal(result.breakdown[0].total_expenses, 28333);
  assert.equal(result.breakdown[1].key, "2026-05-05");
  assert.equal(result.breakdown[1].total_income, 0);
  assert.equal(result.breakdown[1].total_expenses, 7000);
});

test("presentSalesExpensesSummary weekly buckets merge expense-only and container-only periods", () => {
  const result = presentSalesExpensesSummary(
    [
      {
        container_id: "container-1",
        barcode: "32-04",
        paid_at: new Date("2026-05-04T00:00:00.000Z"),
        total_item_sales: 100000,
        total_service_charge: 5000,
        bought_items_profit_loss: 0,
      },
    ],
    [
      {
        created_at: new Date("2026-05-06T10:00:00.000Z"),
        total_amount: 7000,
      },
    ],
    "weekly",
  );

  assert.equal(result.breakdown.length, 1);
  assert.equal(result.breakdown[0].key, "2026-05-03");
  assert.equal(result.breakdown[0].period, "May 3 - May 9");
  assert.deepEqual(result.breakdown[0].paid_containers, [
    {
      barcode: "32-04",
      total_item_sales: 100000,
      total_service_charge: 5000,
    },
  ]);
  assert.equal(result.breakdown[0].total_income, 35000);
  assert.equal(result.breakdown[0].total_expenses, 35333);
});

test("presentSalesExpensesSummary monthly buckets merge expense-only and container-only periods", () => {
  const result = presentSalesExpensesSummary(
    [
      {
        container_id: "container-1",
        barcode: "32-04",
        paid_at: new Date("2026-05-04T00:00:00.000Z"),
        total_item_sales: 100000,
        total_service_charge: 5000,
        bought_items_profit_loss: 0,
      },
    ],
    [
      {
        created_at: new Date("2026-05-31T10:00:00.000Z"),
        total_amount: 7000,
      },
    ],
    "monthly",
  );

  assert.equal(result.breakdown.length, 1);
  assert.equal(result.breakdown[0].key, "04");
  assert.equal(result.breakdown[0].period, "MAY");
  assert.deepEqual(result.breakdown[0].paid_containers, [
    {
      barcode: "32-04",
      total_item_sales: 100000,
      total_service_charge: 5000,
    },
  ]);
  assert.equal(result.breakdown[0].total_income, 35000);
  assert.equal(result.breakdown[0].total_expenses, 35333);
});
