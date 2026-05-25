import type { FinalReportDraft } from "src/entities/models/FinalReportDraft";

export type ResolutionKind = "merge" | "buy" | "split" | "void";

export type RowResolution =
  | { kind: "merge"; targetSoldInventoryId: string; controlChoice?: "UNSOLD" | "SOLD" }
  | { kind: "buy"; price: number; qty: string; auctionId: string; bidderNumber: string }
  | { kind: "split"; sourceAuctionInventoryId: string; price: number; qty: string }
  | { kind: "void" };

export const findResolution = (
  draft: FinalReportDraft,
  inventoryId: string,
): RowResolution | null => {
  const voidEntry = draft.bought_items.find(
    (b) => b.action === "VOID" && b.inventory_id === inventoryId,
  );
  if (voidEntry) return { kind: "void" };

  const buyEntry = draft.bought_items.find(
    (b) => b.action === "BOUGHT" && b.inventory_id === inventoryId,
  );
  if (buyEntry && buyEntry.action === "BOUGHT") {
    return {
      kind: "buy",
      price: buyEntry.price,
      qty: buyEntry.qty,
      auctionId: buyEntry.auction_id,
      bidderNumber: buyEntry.bidder_number,
    };
  }

  const mergeEntry = draft.merged_inventories.find(
    (m) => m.new_inventory_id === inventoryId,
  );
  if (mergeEntry) {
    return {
      kind: "merge",
      targetSoldInventoryId: mergeEntry.old_inventory_id,
      controlChoice: mergeEntry.control_choice,
    };
  }

  for (const split of draft.qty_splits) {
    const found = split.splits.find((s) => s.target_inventory_id === inventoryId);
    if (found) {
      return {
        kind: "split",
        sourceAuctionInventoryId: split.source_auction_inventory_id,
        price: found.price,
        qty: found.qty,
      };
    }
  }

  return null;
};

// Strip an inventory_id from every draft array that could carry a resolution.
// Used when the user switches action on a row or clicks Undo.
export const clearResolution = (
  draft: FinalReportDraft,
  inventoryId: string,
): FinalReportDraft => ({
  ...draft,
  bought_items: draft.bought_items.filter((b) => b.inventory_id !== inventoryId),
  merged_inventories: draft.merged_inventories.filter(
    (m) => m.new_inventory_id !== inventoryId,
  ),
  qty_splits: draft.qty_splits
    .map((s) => ({
      ...s,
      splits: s.splits.filter((sp) => sp.target_inventory_id !== inventoryId),
    }))
    .filter((s) => s.splits.length > 0),
  matches: draft.matches.filter(
    (m) => m.source_inventory_id !== inventoryId,
  ),
  counter_check_matches: draft.counter_check_matches.filter(
    (m) => m.inventory_id !== inventoryId,
  ),
  warehouse_add_ons: draft.warehouse_add_ons.filter(
    (a) => a.inventory_id !== inventoryId,
  ),
});
