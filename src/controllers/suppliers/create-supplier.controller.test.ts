import test from "node:test";
import assert from "node:assert/strict";
import { parseUpdateActivityDescription } from "@/app/lib/activity-log-description";
import { CreateSupplierController } from "./create-supplier.controller";
import { SupplierRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  setupSupplierTest,
  SUPPLIER_INPUT,
  SUPPLIER_ROW,
} from "src/test-utils/supplier-fixture";

test("supplier creation records one cashier activity with supplier identity and user context", async (context) => {
  const fixture = await setupSupplierTest(context);
  const result = await fixture.runAsUser(() => CreateSupplierController(SUPPLIER_INPUT));

  assert.equal(result.ok, true);
  assert.deepEqual(fixture.creates, [SUPPLIER_INPUT]);
  assert.equal(fixture.logs.length, 1);
  assert.deepEqual(fixture.logs[0], {
    action: "CREATE",
    entity_type: "supplier",
    entity_id: SUPPLIER_ROW.supplier_id,
    username: fixture.user.username,
    branch_id: fixture.user.branch.branch_id,
    branch_name: fixture.user.branch.name,
    description: "Created supplier Example Supplier (32-04)",
  });
  // Creation remains a plain description in the activity log screen.
  assert.equal(parseUpdateActivityDescription(fixture.logs[0].description), null);
});

test("supplier creation rejects invalid input without writing or logging success", async (context) => {
  const fixture = await setupSupplierTest(context);
  const result = await fixture.runAsUser(() => CreateSupplierController({ name: "", supplier_code: "" }));

  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Expected invalid input to fail");
  assert.equal(result.error.message, "Invalid Data!");
  assert.deepEqual(fixture.creates, []);
  assert.deepEqual(fixture.logs, []);
});

for (const failure of ["duplicate supplier code", "database failure"]) {
  test(`supplier creation records no success log after ${failure}`, async (context) => {
    const fixture = await setupSupplierTest(context);
    fixture.replace(SupplierRepository, "createSupplier", async () => {
      throw new DatabaseOperationError("Error creating supplier", { cause: failure });
    });

    const result = await fixture.runAsUser(() => CreateSupplierController(SUPPLIER_INPUT));

    assert.equal(result.ok, false);
    if (result.ok) assert.fail("Expected supplier write to fail");
    assert.equal(result.error.message, "Server Error");
    assert.deepEqual(fixture.logs, []);
  });
}
