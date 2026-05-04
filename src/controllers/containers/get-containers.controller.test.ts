import test from "node:test";
import assert from "node:assert/strict";

import { Prisma } from "@prisma/client";
import { presentContainers } from "./get-containers.controller";
import { ContainerListRow } from "src/entities/models/Container";

test("presentContainers derives paid status from paid date presence", () => {
  const baseContainer = {
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
    status: null,
    duties_and_taxes: new Prisma.Decimal(0),
    created_at: new Date("2026-05-01T00:00:00.000Z"),
    updated_at: new Date("2026-05-01T00:00:00.000Z"),
    deleted_at: null,
    branch: { branch_id: "branch-1", name: "Main" },
    supplier: {
      supplier_id: "supplier-1",
      supplier_code: "SUP-1",
      name: "Supplier",
    },
    inventories: [],
    _count: { inventories: 0 },
  } as unknown as ContainerListRow;

  const result = presentContainers([
    baseContainer,
    {
      ...baseContainer,
      container_id: "container-2",
      barcode: "32-05",
      status: new Date("2026-05-02T00:00:00.000Z"),
    } as unknown as ContainerListRow,
  ]);

  assert.equal(result[0].status, "UNPAID");
  assert.equal(result[0].paid_at, null);
  assert.equal(result[1].status, "PAID");
  assert.equal(result[1].paid_at, "May 02, 2026");
});
