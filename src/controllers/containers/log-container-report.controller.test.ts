import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { LogContainerReportController } from "./log-container-report.controller";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("LogContainerReportController logs selected report options in the description", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");
  let activityDescription = "";

  restorers.push(
    patchMethod(
      logActivityModule,
      "logActivity",
      async (_action, _entityType, _entityId, description) => {
        activityDescription = description;
        return undefined as never;
      },
    ),
  );

  const result = await LogContainerReportController({
    container_id: "container-1",
    barcode: "32-04",
    supplier_name: "Sample Supplier",
    selected_dates: ["Apr 13, 2026", "Apr 14, 2026"],
    exclude_bidder_740: true,
    exclude_refunded_bidder_5013: false,
    deduct_thirty_k: true,
    sheets: [
      "monitoring",
      "final_computation",
      "unsold",
      "encode",
      "bill",
      "deductions",
    ],
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected container report log request to succeed");
  }

  assert.equal(
    activityDescription,
    "Generated container report for 32-04 (Sample Supplier) | Auction dates: Apr 13, 2026, Apr 14, 2026 | Remove Bidder 740: Yes | Remove REFUNDED items from Bidder 5013: No | Less 30,000: Yes",
  );
});

test("LogContainerReportController omits bidder 740 option in the description for Tarlac", async () => {
  const logActivityModule = await import("@/app/lib/log-activity");
  let activityDescription = "";

  restorers.push(
    patchMethod(
      logActivityModule,
      "logActivity",
      async (_action, _entityType, _entityId, description) => {
        activityDescription = description;
        return undefined as never;
      },
    ),
  );

  const result = await RequestContext.run(
    {
      branch_id: "tarlac-branch-id",
      branch_name: "TARLAC",
      username: "tester",
    },
    async () =>
      await LogContainerReportController({
        container_id: "container-1",
        barcode: "32-04",
        supplier_name: "Sample Supplier",
        selected_dates: ["Apr 13, 2026", "Apr 14, 2026"],
        exclude_bidder_740: false,
        exclude_refunded_bidder_5013: false,
        deduct_thirty_k: true,
        sheets: [
          "monitoring",
          "final_computation",
          "unsold",
          "encode",
          "bill",
          "deductions",
        ],
      }),
  );

  assert.equal(result.ok, true);
  if (!result.ok) {
    assert.fail("Expected container report log request to succeed");
  }

  assert.equal(
    activityDescription,
    "Generated container report for 32-04 (Sample Supplier) | Auction dates: Apr 13, 2026, Apr 14, 2026 | Remove REFUNDED items from Bidder 5013: No | Less 30,000: Yes",
  );
});
