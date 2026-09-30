import test from "node:test";
import assert from "node:assert/strict";
import { parseUpdateActivityDescription } from "@/app/lib/activity-log-description";
import { UpdateSupplierController } from "./update-supplier.controller";
import { SupplierRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  setupSupplierTest,
  SUPPLIER_INPUT,
  SUPPLIER_ROW,
} from "src/test-utils/supplier-fixture";

test("supplier editing records one cashier activity and displays changed fields with before/after values", async (context) => {
  const fixture = await setupSupplierTest(context);
  const changes = {
    name: "Updated Supplier",
    supplier_code: "32-05",
    japanese_name: "Updated Japanese Name",
    shipper: "Updated Shipper",
    email: "updated@example.com",
    sales_remittance_account: "Updated Account",
    commission: "20",
    contact_number: "09987654321",
  };
  const result = await fixture.runAsUser(() => UpdateSupplierController(SUPPLIER_ROW.supplier_id, changes));

  assert.equal(result.ok, true);
  assert.deepEqual(fixture.updates, [{ supplier_id: SUPPLIER_ROW.supplier_id, data: changes }]);
  assert.equal(fixture.logs.length, 1);
  const [log] = fixture.logs;
  assert.equal(log.action, "UPDATE");
  assert.equal(log.entity_type, "supplier");
  assert.equal(log.entity_id, SUPPLIER_ROW.supplier_id);
  assert.equal(log.username, fixture.user.username);
  assert.equal(log.branch_id, fixture.user.branch.branch_id);
  assert.equal(log.branch_name, fixture.user.branch.name);

  const parsed = parseUpdateActivityDescription(log.description);
  assert.ok(parsed, "Expected the activity log screen to parse the supplier changes");
  assert.deepEqual(parsed.changes, [
    { field: "Name", before: "Example Supplier", after: "Updated Supplier" },
    { field: "Supplier Code", before: "32-04", after: "32-05" },
    { field: "Japanese Name", before: "Japanese Name", after: "Updated Japanese Name" },
    { field: "Shipper", before: "Original Shipper", after: "Updated Shipper" },
    { field: "Email", before: "supplier@example.com", after: "updated@example.com" },
    { field: "Sales Remittance Account", before: "Original Account", after: "Updated Account" },
    { field: "Commission", before: "25", after: "20" },
    { field: "Contact Number", before: "09123456789", after: "09987654321" },
  ]);
  assert.equal(parsed.title, "Updated supplier Updated Supplier (32-05)");
});

test("supplier editing logs only changed fields", async (context) => {
  const fixture = await setupSupplierTest(context);
  const result = await fixture.runAsUser(() => UpdateSupplierController(SUPPLIER_ROW.supplier_id, {
    ...SUPPLIER_INPUT,
    commission: "20",
  }));

  assert.equal(result.ok, true);
  assert.equal(fixture.logs.length, 1);
  assert.deepEqual(parseUpdateActivityDescription(fixture.logs[0].description)?.changes, [
    { field: "Commission", before: "25", after: "20" },
  ]);
});

test("supplier editing rejects invalid input without writing or logging success", async (context) => {
  const fixture = await setupSupplierTest(context);
  const result = await fixture.runAsUser(() => UpdateSupplierController(SUPPLIER_ROW.supplier_id, {
    name: "",
    supplier_code: "",
  }));

  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Expected invalid input to fail");
  assert.equal(result.error.message, "Invalid Data!");
  assert.deepEqual(fixture.reads, []);
  assert.deepEqual(fixture.updates, []);
  assert.deepEqual(fixture.logs, []);
});

test("supplier editing rejects duplicate supplier codes without writing or logging success", async (context) => {
  const fixture = await setupSupplierTest(context);
  fixture.replace(SupplierRepository, "getSupplierBySupplierCode", async () => ({
    ...SUPPLIER_ROW,
    supplier_id: "another-supplier",
    supplier_code: "32-05",
    containers: [],
  }));
  const result = await fixture.runAsUser(() => UpdateSupplierController(SUPPLIER_ROW.supplier_id, {
    ...SUPPLIER_INPUT,
    supplier_code: "32-05",
  }));

  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Expected duplicate supplier code to fail");
  assert.equal(result.error.message, "Invalid Data!");
  assert.deepEqual(result.error.cause, { supplier_code: ["Supplier code already exists!"] });
  assert.deepEqual(fixture.updates, []);
  assert.deepEqual(fixture.logs, []);
});

test("supplier editing rejects missing suppliers without writing or logging success", async (context) => {
  const fixture = await setupSupplierTest(context);
  const result = await fixture.runAsUser(() => UpdateSupplierController("missing-supplier", SUPPLIER_INPUT));

  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Expected missing supplier to fail");
  assert.equal(result.error.message, "Supplier not found!");
  assert.deepEqual(fixture.updates, []);
  assert.deepEqual(fixture.logs, []);
});

test("supplier editing records no success log after a failed write", async (context) => {
  const fixture = await setupSupplierTest(context);
  fixture.replace(SupplierRepository, "updateSupplier", async () => {
    throw new DatabaseOperationError("Error updating Supplier!");
  });
  const result = await fixture.runAsUser(() => UpdateSupplierController(SUPPLIER_ROW.supplier_id, SUPPLIER_INPUT));

  assert.equal(result.ok, false);
  if (result.ok) assert.fail("Expected supplier write to fail");
  assert.equal(result.error.message, "Server Error");
  assert.deepEqual(fixture.logs, []);
});
