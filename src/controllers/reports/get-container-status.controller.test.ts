import test from "node:test";
import assert from "node:assert/strict";

import { presentContainerStatus } from "./get-container-status.controller";

test("presentContainerStatus derives paid status from paid date presence", () => {
  const result = presentContainerStatus([
    {
      barcode: "32-04",
      container_number: "CN-1",
      supplier_name: "Supplier",
      sales_remittance_account: "ATC",
      paid_at: new Date("2026-05-05T00:00:00.000Z"),
      arrival_date: new Date("2026-04-28T00:00:00.000Z"),
      due_date: new Date("2026-05-03T00:00:00.000Z"),
      duties_and_taxes: 4500.5,
      total_items: 12,
      paid_items: 9,
      total_item_sales: 320000,
      total_service_charge: 16000,
    },
    {
      barcode: "32-05",
      container_number: null,
      supplier_name: "Supplier",
      sales_remittance_account: "ATC",
      paid_at: null,
      arrival_date: null,
      due_date: null,
      duties_and_taxes: 0,
      total_items: 0,
      paid_items: 0,
      total_item_sales: 0,
      total_service_charge: 0,
    },
    {
      barcode: "32-06",
      container_number: null,
      supplier_name: "Supplier",
      sales_remittance_account: "ATC",
      paid_at: new Date("2026-05-01T00:00:00.000Z"),
      arrival_date: new Date("2026-04-28T00:00:00.000Z"),
      due_date: new Date("2026-05-03T00:00:00.000Z"),
      duties_and_taxes: 0,
      total_items: 0,
      paid_items: 0,
      total_item_sales: 0,
      total_service_charge: 0,
    },
  ]);

  assert.equal(result[0].status, "PAID");
  assert.equal(result[0].paid_at, "May 05, 2026");
  assert.equal(result[0].days_since_arrival, 0);
  assert.equal(result[0].days_left, null);
  assert.equal(result[0].delay_days, 2);
  assert.equal(result[1].status, "UNPAID");
  assert.equal(result[1].paid_at, null);
  assert.equal(result[1].days_left, null);
  assert.equal(result[1].delay_days, null);
  assert.equal(result[2].status, "PAID");
  assert.equal(result[2].days_left, null);
  assert.equal(result[2].delay_days, null);
});
