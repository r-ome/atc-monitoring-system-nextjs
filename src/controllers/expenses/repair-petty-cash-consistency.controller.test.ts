import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { RepairPettyCashConsistencyController } from "./repair-petty-cash-consistency.controller";
import { ExpensesRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("RepairPettyCashConsistencyController enforces yyyy-MM-dd inputs and ascending date ranges", async () => {
  const invalidFormat = await RepairPettyCashConsistencyController(
    "branch-1",
    "04/01/2026",
    "2026-04-02",
  );

  assert.equal(invalidFormat.ok, false);
  if (invalidFormat.ok) {
    assert.fail("Expected invalid date format to fail");
  }
  assert.equal(
    invalidFormat.error?.message,
    "Invalid date format. Expected yyyy-MM-dd.",
  );

  const descendingRange = await RepairPettyCashConsistencyController(
    "branch-1",
    "2026-04-03",
    "2026-04-02",
  );

  assert.equal(descendingRange.ok, false);
  if (descendingRange.ok) {
    assert.fail("Expected descending date range to fail");
  }
  assert.equal(
    descendingRange.error?.message,
    "Start date must not be after end date.",
  );
});

test("RepairPettyCashConsistencyController delegates valid repair windows", async () => {
  let capturedArgs: string[] | undefined;

  restorers.push(
    patchMethod(ExpensesRepository, "repairConsistency", async (branchId, startDate, endDate) => {
      capturedArgs = [branchId, startDate, endDate];
      return {
        repaired_from: "2026-04-01",
        days_fixed: 2,
        snapshot: [],
      } as never;
    }),
  );

  const result = await RepairPettyCashConsistencyController(
    "branch-1",
    "2026-04-01",
    "2026-04-02",
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected valid repair window to succeed");
  }
  assert.deepEqual(capturedArgs, ["branch-1", "2026-04-01", "2026-04-02"]);
});
