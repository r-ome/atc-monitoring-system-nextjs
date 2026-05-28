import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { LogFinalReportGenerationController } from "./log-final-report-generation.controller";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("LogFinalReportGenerationController logs final report action options and data", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");
  let action = "";
  let entityType = "";
  let entityId = "";
  let activityDescription = "";

  restorers.push(
    patchMethod(
      logActivityModule,
      "logActivity",
      async (loggedAction, loggedEntityType, loggedEntityId, description) => {
        action = loggedAction;
        entityType = loggedEntityType;
        entityId = loggedEntityId;
        activityDescription = description;
        return undefined as never;
      },
    ),
  );

  const result = await LogFinalReportGenerationController({
    container_id: "container-1",
    barcode: "25-38",
    supplier_name: "Raikuru Co.,Ltd.",
    action: "preview_modified",
    workbook_variant: "modified",
    options: [
      { option: "Auction dates", value: "May 09, 2026" },
      { option: "Less 30,000", value: "Yes" },
    ],
    data: [
      { option: "Monitoring rows", value: "10" },
      { option: "Net to supplier", value: "₱20,000" },
    ],
  });

  assert.equal(result.ok, true);
  assert.equal(action, "CREATE");
  assert.equal(entityType, "final_report");
  assert.equal(entityId, "container-1");

  assert.deepEqual(JSON.parse(activityDescription), {
    type: "final_report_generated",
    action: "preview_modified",
    summary:
      "Generated modified final report preview for 25-38 (Raikuru Co.,Ltd.)",
    barcode: "25-38",
    supplier_name: "Raikuru Co.,Ltd.",
    workbook_variant: "modified",
    options: [
      { option: "Auction dates", value: "May 09, 2026" },
      { option: "Less 30,000", value: "Yes" },
    ],
    data: [
      { option: "Monitoring rows", value: "10" },
      { option: "Net to supplier", value: "₱20,000" },
    ],
    files: [],
  });
});

test("LogFinalReportGenerationController logs finalize as an update", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");
  let action = "";

  restorers.push(
    patchMethod(
      logActivityModule,
      "logActivity",
      async (loggedAction) => {
        action = loggedAction;
        return undefined as never;
      },
    ),
  );

  const result = await LogFinalReportGenerationController({
    container_id: "container-1",
    barcode: "25-38",
    supplier_name: "Raikuru Co.,Ltd.",
    action: "finalize",
  });

  assert.equal(result.ok, true);
  assert.equal(action, "UPDATE");
});
