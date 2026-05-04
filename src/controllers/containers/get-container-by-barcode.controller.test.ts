import test from "node:test";
import assert from "node:assert/strict";

import { Prisma } from "@prisma/client";
import { presentContainerDetails } from "./get-container-by-barcode.controller";
import { ContainerWithDetailsRow } from "src/entities/models/Container";

test("presentContainerDetails includes derived paid date and status", () => {
  const result = presentContainerDetails({
    container_id: "container-1",
    supplier_id: "supplier-1",
    branch_id: "branch-1",
    barcode: "32-04",
    bill_of_lading_number: null,
    container_number: null,
    arrival_date: null,
    due_date: null,
    gross_weight: null,
    auction_or_sell: "SELL",
    status: new Date("2026-05-02T00:00:00.000Z"),
    duties_and_taxes: new Prisma.Decimal(0),
    created_at: new Date("2026-05-01T00:00:00.000Z"),
    updated_at: new Date("2026-05-01T00:00:00.000Z"),
    deleted_at: null,
    branch: { branch_id: "branch-1", name: "Main" },
    supplier: {
      supplier_id: "supplier-1",
      supplier_code: "SUP-1",
      name: "Supplier",
      sales_remittance_account: "ATC",
    },
    inventories: [],
  } as unknown as ContainerWithDetailsRow);

  assert.equal(result.status, "PAID");
  assert.equal(result.paid_at, "May 02, 2026");
});
