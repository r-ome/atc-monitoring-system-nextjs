import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { LogCashFlowReportController } from "./log-cash-flow-report.controller";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("LogCashFlowReportController logs generated daily cash flow reports", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");
  let activityAction = "";
  let activityEntityType = "";
  let activityEntityId = "";
  let activityDescription = "";

  restorers.push(
    patchMethod(
      logActivityModule,
      "logActivity",
      async (action, entityType, entityId, description) => {
        activityAction = action;
        activityEntityType = entityType;
        activityEntityId = entityId;
        activityDescription = description;
        return undefined as never;
      },
    ),
  );

  const result = await LogCashFlowReportController({
    date: "2026-05-05",
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected cash flow report log request to succeed");
  }

  assert.equal(activityAction, "CREATE");
  assert.equal(activityEntityType, "cash_flow_report");
  assert.equal(activityEntityId, "2026-05-05");
  assert.equal(
    activityDescription,
    "Generated daily cash flow report for May 05, 2026",
  );
});
