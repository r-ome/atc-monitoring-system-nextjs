import type {
  FinalReportPreview,
  FinalReportMonitoringRow,
  FinalReportInventoryRow,
} from "src/entities/models/FinalReport";

export const buildReportData = (
  preview: FinalReportPreview,
  splitSelections: string[],
): { monitoring: FinalReportMonitoringRow[]; inventories: FinalReportInventoryRow[] } => {
  let monitoring: FinalReportMonitoringRow[] = [...preview.report.monitoring];
  let inventories: FinalReportInventoryRow[] = [...preview.report.inventories];

  for (const candidate of preview.split_candidates) {
    if (!splitSelections.includes(candidate.candidate_id)) continue;

    const source = monitoring.find(
      (item) =>
        item.auction_inventory_id === candidate.monitoring_item.auction_inventory_id,
    );
    if (!source) continue;

    const sourceQty = Number(source.qty);
    if (!Number.isFinite(sourceQty) || sourceQty <= 1) continue;

    const splitPrice = Math.round(source.price / sourceQty);
    monitoring = monitoring.map((item) =>
      item.auction_inventory_id === source.auction_inventory_id
        ? { ...item, qty: String(sourceQty - 1), price: Math.max(0, item.price - splitPrice) }
        : item,
    );
    monitoring.push({
      ...source,
      auction_inventory_id: `${source.auction_inventory_id}:${candidate.unsold_item.inventory_id}`,
      inventory_id: candidate.unsold_item.inventory_id,
      barcode: candidate.unsold_item.barcode,
      control: candidate.unsold_item.control,
      description: candidate.unsold_item.description,
      qty: "1",
      price: splitPrice,
      status: "SOLD",
    });
    inventories = inventories.map((item) =>
      item.inventory_id === candidate.unsold_item.inventory_id
        ? { ...item, status: "SOLD" }
        : item,
    );
  }

  return { monitoring, inventories };
};
