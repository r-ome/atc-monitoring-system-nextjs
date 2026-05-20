import { NotFoundError } from "src/entities/errors/common";
import {
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import type { MergeInventoriesResult } from "src/entities/models/Inventory";

export type FinalizeFinalReportResult = {
  container_id: string;
  merged_inventories: Array<{
    entity_id: string;
    result: MergeInventoriesResult;
  }>;
};

export const finalizeFinalReportUseCase = async (input: {
  container_id: string;
  username?: string;
}): Promise<FinalizeFinalReportResult> => {
  const draft = await ContainerRepository.getFinalReportDraft(input.container_id);
  if (!draft) {
    throw new NotFoundError("No draft to finalize for this container.");
  }

  const mergedInventories: FinalizeFinalReportResult["merged_inventories"] = [];

  // Apply mutations in a sensible order. Each existing repo method opens its own
  // transaction; sequencing them is not fully atomic, but each method validates
  // its own preconditions and throws on conflict, leaving the draft intact so
  // the user can refresh and retry.

  // 1) Manual merges staged from the UNSOLD overview
  for (const merge of draft.merged_inventories) {
    const result = await InventoryRepository.mergeInventories(merge);
    mergedInventories.push({
      entity_id: merge.new_inventory_id,
      result,
    });
  }

  // 2) VOIDs
  for (const item of draft.bought_items) {
    if (item.action === "VOID") {
      await InventoryRepository.applyVoidInventory(
        { inventory_id: item.inventory_id },
        input.username,
      );
    }
  }

  // 3) BOUGHT decisions (creates auction_inventories)
  for (const item of draft.bought_items) {
    if (item.action === "BOUGHT") {
      await InventoryRepository.applyDirectBoughtItem(
        {
          inventory_id: item.inventory_id,
          auction_id: item.auction_id,
          auction_date: item.auction_date,
          price: item.price,
          qty: item.qty,
        },
        input.username,
      );
    }
  }

  // 4) Clear the draft only on full success
  await ContainerRepository.clearFinalReportDraft(input.container_id);

  return { container_id: input.container_id, merged_inventories: mergedInventories };
};
