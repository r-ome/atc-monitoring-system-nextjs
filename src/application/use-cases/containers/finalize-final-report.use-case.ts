import { NotFoundError } from "src/entities/errors/common";
import {
  ContainerRepository,
  InventoryRepository,
} from "src/infrastructure/di/repositories";
import type { MergeInventoriesResult } from "src/entities/models/Inventory";
import type {
  ContainerFinalReportChangesRecord,
  ContainerTaxDeductionRecord,
  FinalReportBoughtItemChange,
  FinalReportDeductionItem,
  FinalReportMergeChange,
  FinalReportVoidedItemChange,
} from "src/entities/models/FinalReport";

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

  // 4) Snapshot what changed so the Breakdown panel still reflects it after the
  // draft is cleared. The draft only stores ids/amounts; enrich each entry with
  // descriptive fields (barcode/control/description/bidder) from the current
  // container state. Container is fetched after mutations so we read the
  // post-finalize descriptive snapshot (these fields don't change during
  // merge/void/bought, so the snapshot is stable).
  const hasAnyChanges =
    draft.tax_edits.length > 0 ||
    draft.bought_items.length > 0 ||
    draft.merged_inventories.length > 0;

  if (hasAnyChanges) {
    const container = await ContainerRepository.getContainerById(
      input.container_id,
    );
    if (container) {
      const byInventoryId = new Map<
        string,
        {
          barcode: string;
          control: string;
          description: string;
          price: number;
          bidder_number: string;
        }
      >();
      const byBarcodeControl = new Map<string, { inventory_id: string }>();
      for (const inv of container.inventories) {
        const control = inv.control ?? "NC";
        const ai = inv.auctions_inventory;
        byInventoryId.set(inv.inventory_id, {
          barcode: inv.barcode,
          control,
          description: inv.description ?? "",
          price: Number(ai?.price ?? 0),
          bidder_number: ai?.auction_bidder?.bidder?.bidder_number ?? "",
        });
        byBarcodeControl.set(`${inv.barcode}|${control}`, {
          inventory_id: inv.inventory_id,
        });
      }

      // 4a) Tax Step deductions → tax_deduction record (existing column, still
      // used by the preview's persisted-deduction path).
      if (draft.tax_edits.length > 0) {
        const items: FinalReportDeductionItem[] = draft.tax_edits
          .filter((edit) => edit.deducted_amount > 0)
          .map((edit) => {
            const info = byBarcodeControl.get(`${edit.barcode}|${edit.control}`);
            const inv = info ? byInventoryId.get(info.inventory_id) : undefined;
            const original_price = inv?.price ?? 0;
            return {
              control: edit.control || "NC",
              description: inv?.description ?? "",
              bidder_number: inv?.bidder_number ?? "",
              original_price,
              deducted_amount: edit.deducted_amount,
            };
          });

        if (items.length > 0) {
          const record: ContainerTaxDeductionRecord = {
            applied_at: new Date().toISOString(),
            applied_by: input.username ?? null,
            options: {
              selected_dates: draft.options.selected_dates,
              exclude_bidder_740: draft.options.exclude_bidder_740,
              exclude_refunded_bidder_5013:
                draft.options.exclude_refunded_bidder_5013,
            },
            items,
          };
          await ContainerRepository.setContainerTaxDeduction(
            input.container_id,
            record,
          );
        }
      }

      // 4b) Non-tax modifications → final_report_changes record.
      const bought_items: FinalReportBoughtItemChange[] = [];
      const voided_items: FinalReportVoidedItemChange[] = [];
      for (const item of draft.bought_items) {
        const inv = byInventoryId.get(item.inventory_id);
        if (item.action === "VOID") {
          voided_items.push({
            inventory_id: item.inventory_id,
            barcode: inv?.barcode ?? "",
            control: inv?.control ?? "NC",
            description: inv?.description ?? "",
          });
        } else {
          bought_items.push({
            inventory_id: item.inventory_id,
            barcode: inv?.barcode ?? "",
            control: inv?.control ?? "NC",
            description: inv?.description ?? "",
            bidder_number: item.bidder_number,
            auction_date: item.auction_date,
            price: item.price,
            qty: item.qty,
          });
        }
      }

      const merges: FinalReportMergeChange[] = draft.merged_inventories.map(
        (m) => {
          const sold = byInventoryId.get(m.old_inventory_id);
          const unsold = byInventoryId.get(m.new_inventory_id);
          return {
            sold: {
              inventory_id: m.old_inventory_id,
              barcode: sold?.barcode ?? "",
              control: sold?.control ?? "NC",
              description: sold?.description ?? "",
            },
            unsold: {
              inventory_id: m.new_inventory_id,
              barcode: unsold?.barcode ?? "",
              control: unsold?.control ?? "NC",
              description: unsold?.description ?? "",
            },
          };
        },
      );

      if (
        bought_items.length > 0 ||
        voided_items.length > 0 ||
        merges.length > 0
      ) {
        const changesRecord: ContainerFinalReportChangesRecord = {
          applied_at: new Date().toISOString(),
          applied_by: input.username ?? null,
          bought_items,
          voided_items,
          merges,
        };
        await ContainerRepository.setContainerFinalReportChanges(
          input.container_id,
          changesRecord,
        );
      } else {
        // No non-tax changes this finalize — clear any stale prior record so the
        // panel doesn't show modifications from a previous run.
        await ContainerRepository.clearContainerFinalReportChanges(
          input.container_id,
        );
      }
    }
  }

  // 5) Clear the draft only on full success
  await ContainerRepository.clearFinalReportDraft(input.container_id);

  return { container_id: input.container_id, merged_inventories: mergedInventories };
};
