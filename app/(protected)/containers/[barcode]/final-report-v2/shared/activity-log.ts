import type { ContainerReportSheet } from "src/entities/models/Container";
import type { FinalReportPreview } from "src/entities/models/FinalReport";
import type { FinalReportDraft } from "src/entities/models/FinalReportDraft";
import type { V2ContainerContext, V2WizardOptions } from "./types";
import { peso } from "./format";

const yesNo = (value: boolean) => (value ? "Yes" : "No");

const countDraftSplits = (draft: FinalReportDraft) =>
  draft.qty_splits.reduce((sum, split) => sum + split.splits.length, 0);

export const buildFinalReportGenerationLogInput = ({
  action,
  workbookVariant,
  container,
  options,
  sheets,
  preview,
  draft,
  reassignedBidder5013Count = 0,
}: {
  action: "preview_original" | "preview_modified" | "finalize";
  workbookVariant?: "original" | "modified";
  container: V2ContainerContext;
  options: V2WizardOptions;
  sheets: ContainerReportSheet[];
  preview: FinalReportPreview;
  draft: FinalReportDraft;
  reassignedBidder5013Count?: number;
}) => {
  const deductionTotal = preview.report.deductions.reduce(
    (sum, item) => sum + item.deducted_amount,
    0,
  );
  const netToSupplier = preview.report.monitoring.reduce(
    (sum, item) => sum + item.price,
    0,
  );

  return {
    container_id: container.container_id,
    barcode: container.barcode,
    supplier_name: container.supplier.name,
    action,
    ...(workbookVariant ? { workbook_variant: workbookVariant } : {}),
    options: [
      {
        option: "Auction dates",
        value: options.selected_dates.join(", "),
      },
      {
        option: "Remove REFUNDED items from Bidder 5013",
        value: yesNo(options.exclude_refunded_bidder_5013),
      },
      {
        option: "Remove Bidder 740",
        value: yesNo(options.exclude_bidder_740),
      },
      {
        option: "Less 30,000",
        value: yesNo(options.deduct_thirty_k),
      },
      {
        option: "Sheets",
        value: sheets.join(", "),
      },
    ],
    data: [
      { option: "Monitoring rows", value: String(preview.report.monitoring.length) },
      { option: "Inventory rows", value: String(preview.report.inventories.length) },
      { option: "Deduction rows", value: String(preview.report.deductions.length) },
      { option: "Deduction total", value: peso(deductionTotal) },
      { option: "Net to supplier", value: peso(netToSupplier) },
      { option: "UNSOLD attention rows", value: String(preview.attention_items.length) },
      { option: "Unresolved UNSOLD rows", value: String(preview.unsold_items.length) },
      { option: "Auto matched rows", value: String(preview.auto_resolved.length) },
      { option: "Split candidates", value: String(preview.split_candidates.length) },
      { option: "Warehouse check rows", value: String(preview.warehouse_check_items.length) },
      { option: "Appendable two-part rows", value: String(preview.appendable_unsold_items.length) },
      { option: "Merged rows staged", value: String(draft.merged_inventories.length) },
      {
        option: "Bought rows staged",
        value: String(draft.bought_items.filter((item) => item.action === "BOUGHT").length),
      },
      {
        option: "Voided rows staged",
        value: String(draft.bought_items.filter((item) => item.action === "VOID").length),
      },
      { option: "Qty split rows staged", value: String(countDraftSplits(draft)) },
      { option: "Appended rows staged", value: String(draft.appended_inventory_ids.length) },
      { option: "Tax edits staged", value: String(draft.tax_edits.length) },
      {
        option: "Reassigned Bidder 5013 rows",
        value: String(reassignedBidder5013Count),
      },
    ],
  };
};
