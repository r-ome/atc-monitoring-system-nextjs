import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { ActivityLogRepository } from "./activity-logs.repository";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) restorers.pop()?.();
});

test("payment update logs restrict history to the selected payments and branch, including later edits", async () => {
  const queries: Array<Record<string, unknown>> = [];
  restorers.push(
    patchMethod(
      prisma.activity_logs,
      "findMany",
      (async (args: Record<string, unknown>) => {
        queries.push(args);
        return [];
      }) as typeof prisma.activity_logs.findMany,
    ),
  );

  await ActivityLogRepository.getPaymentUpdateLogs(
    ["payment-1", "payment-2"],
    "branch-1",
  );

  assert.deepEqual(queries, [
    {
      where: {
        action: "UPDATE",
        entity_type: "payment",
        entity_id: { in: ["payment-1", "payment-2"] },
        branch_id: "branch-1",
      },
      orderBy: { created_at: "desc" },
    },
  ]);
  // No log-date limit: later edits remain attached to the original payments.
  // Undo logs use auction_inventory and cannot match this entity type.
  assert.equal("created_at" in (queries[0].where as object), false);
});

test("payment update logs skip the database when the selected day has no payments", async () => {
  restorers.push(
    patchMethod(
      prisma.activity_logs,
      "findMany",
      (async () => {
        assert.fail("An empty payment list must not query activity logs");
      }) as typeof prisma.activity_logs.findMany,
    ),
  );

  assert.deepEqual(
    await ActivityLogRepository.getPaymentUpdateLogs([], "branch-1"),
    [],
  );
});
