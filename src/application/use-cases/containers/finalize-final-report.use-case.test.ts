import test from "node:test";
import assert from "node:assert/strict";

import {
  finalizeFinalReportUseCase,
} from "./finalize-final-report.use-case";
import {
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import { emptyFinalReportDraft } from "src/entities/models/FinalReportDraft";
import { patchMethod } from "src/test-utils/patch";

test("finalizeFinalReportUseCase applies staged manual merges during finalize", async () => {
  const draft = {
    ...emptyFinalReportDraft({
      selected_dates: ["May 07, 2026"],
      exclude_bidder_740: false,
      exclude_refunded_bidder_5013: false,
      deduct_thirty_k: false,
    }),
    merged_inventories: [
      {
        old_inventory_id: "monitoring-source-1",
        new_inventory_id: "unsold-1",
        control_choice: "SOLD" as const,
      },
    ],
  };
  const mergeCalls: unknown[] = [];
  let clearedContainerId = "";

  const restoreDraft = patchMethod(
    ContainerRepository,
    "getFinalReportDraft",
    async () => draft,
  );
  const restoreMerge = patchMethod(
    InventoryRepository,
    "mergeInventories",
    async (input) => {
      mergeCalls.push(input);
      return {
        merged_into_barcode: "32-04",
        items: [
          {
            barcode: "32-04",
            control: "0001",
            description: "BAG",
            price: "500",
            bidder_number: "0001",
          },
          {
            barcode: "32-04-001",
            control: "0001",
            description: "BAG",
            price: "",
            bidder_number: "",
          },
        ],
      };
    },
  );
  const restoreClear = patchMethod(
    ContainerRepository,
    "clearFinalReportDraft",
    async (container_id) => {
      clearedContainerId = container_id;
    },
  );

  try {
    const result = await finalizeFinalReportUseCase({
      container_id: "container-1",
      username: "admin",
    });

    assert.deepEqual(mergeCalls, [draft.merged_inventories[0]]);
    assert.equal(clearedContainerId, "container-1");
    assert.equal(result.merged_inventories.length, 1);
    assert.equal(result.merged_inventories[0].entity_id, "unsold-1");
    assert.equal(
      result.merged_inventories[0].result.merged_into_barcode,
      "32-04",
    );
  } finally {
    restoreClear();
    restoreMerge();
    restoreDraft();
  }
});
