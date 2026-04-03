import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import {
  GetExpensesSummaryController,
  presentExpensesSummary,
} from "./get-expenses-summary.controller";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("presentExpensesSummary formats detailed expense rows for report display", () => {
  const result = presentExpensesSummary([
    {
      expense_id: "expense-1",
      created_at: new Date("2026-04-03T09:15:00Z"),
      amount: 1250.5,
      purpose: "EXPENSE",
      remarks: "Forklift repair",
    },
  ]);

  assert.deepEqual(result, [
    {
      expense_id: "expense-1",
      created_at: "Apr 03, 2026 05:15 PM",
      created_at_value: "2026-04-03T09:15:00.000Z",
      amount: 1250.5,
      purpose: "EXPENSE",
      remarks: "Forklift repair",
    },
  ]);
});

test("GetExpensesSummaryController delegates to the repository and returns presented rows", async () => {
  let capturedArgs: string[] | undefined;

  restorers.push(
    patchMethod(ReportsRepository, "getExpensesSummary", async (branch_id, date) => {
      capturedArgs = [branch_id, date];
      return [
        {
          expense_id: "expense-1",
          created_at: new Date("2026-04-03T09:15:00Z"),
          amount: 1250.5,
          purpose: "EXPENSE",
          remarks: "Forklift repair",
        },
      ] as never;
    }),
  );

  const result = await GetExpensesSummaryController("branch-1", "2026-04");

  assert.deepEqual(capturedArgs, ["branch-1", "2026-04"]);
  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected expense summary controller to succeed");
  }

  assert.deepEqual(result.value, [
    {
      expense_id: "expense-1",
      created_at: "Apr 03, 2026 05:15 PM",
      created_at_value: "2026-04-03T09:15:00.000Z",
      amount: 1250.5,
      purpose: "EXPENSE",
      remarks: "Forklift repair",
    },
  ]);
});
