import type {
  inventory_sales_allocation,
  inventory_sales_allocation_reason,
} from "@prisma/client";

type ContainerForAllocation = {
  barcode: string;
  status: Date | string | null;
};

export type InventorySalesAllocation = inventory_sales_allocation;
export type InventorySalesAllocationReason = inventory_sales_allocation_reason;

export type InventorySalesAllocationDecision = {
  sales_allocation: InventorySalesAllocation;
  sales_allocation_reason: InventorySalesAllocationReason;
  sales_allocation_note?: string | null;
};

export const DEFAULT_INVENTORY_SALES_ALLOCATION: InventorySalesAllocationDecision = {
  sales_allocation: "CONTAINER",
  sales_allocation_reason: "NORMAL",
  sales_allocation_note: null,
};

export function isAtcContainerBarcode(barcode: string) {
  const normalized = barcode.toUpperCase();
  return normalized.startsWith("00") || normalized.startsWith("T0");
}

export function getInventorySalesAllocationForContainer(
  container: ContainerForAllocation,
  reasonWhenPaid: Extract<
    InventorySalesAllocationReason,
    "ENCODED_AFTER_CONTAINER_PAID" | "TRANSFERRED_TO_PAID_CONTAINER"
  >,
): InventorySalesAllocationDecision {
  if (isAtcContainerBarcode(container.barcode)) {
    return {
      sales_allocation: "ATC",
      sales_allocation_reason: "ATC_CONTAINER",
      sales_allocation_note: null,
    };
  }

  if (container.status) {
    return {
      sales_allocation: "ATC",
      sales_allocation_reason: reasonWhenPaid,
      sales_allocation_note: null,
    };
  }

  return DEFAULT_INVENTORY_SALES_ALLOCATION;
}

export function buildSalesAllocationChangedHistoryRemark(input: {
  previous_allocation: InventorySalesAllocation;
  new_allocation: InventorySalesAllocation;
  reason: InventorySalesAllocationReason;
  updated_by?: string;
}) {
  const parts = [
    "Sales allocation changed",
    `${input.previous_allocation} -> ${input.new_allocation}`,
    `Reason: ${input.reason.replace(/_/g, " ")}`,
  ];

  if (input.updated_by) {
    parts.push(`Updated by: ${input.updated_by.replace(/\s+/g, " ").trim()}`);
  }

  return parts.join(" | ");
}
