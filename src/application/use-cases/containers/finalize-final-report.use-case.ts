import { NotFoundError } from "src/entities/errors/common";
import {
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import { uploadBoughtItemsUseCase } from "src/application/use-cases/inventories/upload-bought-items.use-case";
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

  // 3) Matches (auto-resolved + reviewed)
  if (draft.matches.length > 0) {
    await InventoryRepository.resolveFinalReportMatches(
      { matches: draft.matches },
      input.username,
    );
  }

  // 4) Counter-check matches
  if (draft.counter_check_matches.length > 0) {
    await InventoryRepository.resolveFinalReportCounterCheckMatches(
      {
        matches: draft.counter_check_matches.map((m) => ({
          inventory_id: m.inventory_id,
          auction_bidder_id: m.auction_bidder_id,
          counter_check_id: m.counter_check_id,
          price: m.price,
          qty: m.qty,
          description: m.description,
          manifest_number: m.manifest_number,
          auction_date: m.auction_date,
        })),
      },
      input.username,
    );
  }

  // 5) Qty splits (one transaction per split source)
  for (const split of draft.qty_splits) {
    await InventoryRepository.applySplitBoughtItems(split, input.username);
  }

  // 6) Warehouse add-ons
  if (draft.warehouse_add_ons.length > 0) {
    await InventoryRepository.createFinalReportAddOns(
      {
        items: draft.warehouse_add_ons.map((a) => ({
          inventory_id: a.inventory_id,
          auction_bidder_id: a.auction_bidder_id,
          price: a.price,
          qty: a.qty,
          description: a.description,
          manifest_number: a.manifest_number,
          auction_date: a.auction_date,
        })),
      },
      input.username,
    );
  }

  // 7) Warehouse-staged brand-new bought items
  if (
    draft.warehouse_bought_items.length > 0 &&
    draft.warehouse_bought_items_branch_id
  ) {
    await uploadBoughtItemsUseCase(
      draft.warehouse_bought_items_branch_id,
      draft.warehouse_bought_items.map((item) => ({
        BARCODE: item.barcode,
        CONTROL: item.control,
        DESCRIPTION: item.description,
        OLD_PRICE: String(item.price),
        NEW_PRICE: "",
      })),
      input.username,
    );
  }

  // 8) BOUGHT decisions (creates auction_inventories)
  for (const item of draft.bought_items) {
    if (item.action === "BOUGHT") {
      await InventoryRepository.applyDirectBoughtItem(
        {
          inventory_id: item.inventory_id,
          auction_id: item.auction_id,
          price: item.price,
          qty: item.qty,
        },
        input.username,
      );
    }
  }

  // 9) Clear the draft only on full success
  await ContainerRepository.clearFinalReportDraft(input.container_id);

  return { container_id: input.container_id, merged_inventories: mergedInventories };
};
