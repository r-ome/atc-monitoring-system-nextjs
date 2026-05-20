import type {
  FinalReportPreview,
  FinalReportMonitoringRow,
  FinalReportInventoryRow,
} from "src/entities/models/FinalReport";

export const buildReportData = (
  preview: FinalReportPreview,
  _splitSelections: string[],
): { monitoring: FinalReportMonitoringRow[]; inventories: FinalReportInventoryRow[] } => {
  return {
    monitoring: [...preview.report.monitoring],
    inventories: [...preview.report.inventories],
  };
};
