import test from "node:test";
import assert from "node:assert/strict";
import { createSupplier, getSupplierBySupplierCode, updateSupplier } from "./actions";
import { USER_ROLES } from "src/entities/models/User";
import {
  setupSupplierTest,
  supplierFormData,
  SUPPLIER_ROW,
} from "src/test-utils/supplier-fixture";

for (const role of USER_ROLES) {
  const allowed = role === "OWNER" || role === "SUPER_ADMIN" || role === "CASHIER";

  for (const operation of ["create", "detail", "update"] as const) {
    test(`supplier ${operation}: ${role} is ${allowed ? "allowed" : "blocked"}`, async (context) => {
      const fixture = await setupSupplierTest(context, role);
      const result = operation === "create"
        ? await createSupplier(supplierFormData())
        : operation === "update"
          ? await updateSupplier(SUPPLIER_ROW.supplier_id, supplierFormData())
          : await getSupplierBySupplierCode(SUPPLIER_ROW.supplier_code);

      if (!allowed) {
        assert.equal(result.ok, false);
        if (result.ok) assert.fail("Expected unauthorized supplier action");
        assert.equal(result.error.message, "Unauthorized");
        assert.deepEqual(fixture.creates, []);
        assert.deepEqual(fixture.updates, []);
        assert.deepEqual(fixture.reads, []);
        assert.deepEqual(fixture.logs, []);
        return;
      }

      assert.equal(result.ok, true);
      if (!result.ok) assert.fail(`Expected ${role} supplier ${operation} to succeed`);
      assert.equal(result.value.supplier_id, SUPPLIER_ROW.supplier_id);
      assert.equal(fixture.creates.length, operation === "create" ? 1 : 0);
      assert.equal(fixture.updates.length, operation === "update" ? 1 : 0);

      // The application deliberately excludes SUPER_ADMIN activity logs.
      if (operation === "detail" || role === "SUPER_ADMIN") {
        assert.deepEqual(fixture.logs, []);
        return;
      }

      assert.equal(fixture.logs.length, 1);
      const [log] = fixture.logs;
      assert.equal(log.action, operation === "create" ? "CREATE" : "UPDATE");
      assert.equal(log.entity_type, "supplier");
      assert.equal(log.entity_id, SUPPLIER_ROW.supplier_id);
      assert.equal(log.username, fixture.user.username);
      assert.equal(log.branch_id, fixture.user.branch.branch_id);
      assert.equal(log.branch_name, fixture.user.branch.name);
    });
  }
}
