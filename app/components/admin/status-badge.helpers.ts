import { type VariantProps } from "class-variance-authority"
import { type AuctionItemStatus } from "src/entities/models/Auction"
import { type ExpensePurpose } from "src/entities/models/Expense"
import { type InventoryStatus } from "src/entities/models/Inventory"
import { type statusBadgeVariants } from "./status-badge"

type StatusBadgeVariant = NonNullable<VariantProps<typeof statusBadgeVariants>["variant"]>

export type BranchBadgeValue = string

const INVENTORY_STATUS_VARIANTS: Record<InventoryStatus, StatusBadgeVariant> = {
  SOLD: "success",
  UNSOLD: "error",
  BOUGHT_ITEM: "success",
  VOID: "neutral",
}

const AUCTION_STATUS_VARIANTS: Record<AuctionItemStatus, StatusBadgeVariant> = {
  PAID: "success",
  UNPAID: "error",
  CANCELLED: "neutral",
  REFUNDED: "info",
  DISCREPANCY: "warning",
  PARTIAL: "warning",
}

const EXPENSE_TYPE_VARIANTS: Record<ExpensePurpose, StatusBadgeVariant> = {
  ADD_PETTY_CASH: "success",
  EXPENSE: "error",
  SALARY: "error",
}

const formatStatusLabel = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

const normalizeBranchName = (branch: string) =>
  branch
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()

export const getInventoryStatusVariant = (status: InventoryStatus) =>
  INVENTORY_STATUS_VARIANTS[status]

export const getAuctionStatusVariant = (status: AuctionItemStatus) =>
  AUCTION_STATUS_VARIANTS[status]

export const formatInventoryStatusLabel = (status: InventoryStatus) =>
  formatStatusLabel(status)

export const formatAuctionStatusLabel = (status: AuctionItemStatus) =>
  formatStatusLabel(status)

export const getExpenseTypeVariant = (expenseType: ExpensePurpose) =>
  EXPENSE_TYPE_VARIANTS[expenseType]

export const formatExpenseTypeLabel = (expenseType: ExpensePurpose) =>
  formatStatusLabel(expenseType)

export const getBranchBadgeVariant = (
  branch: BranchBadgeValue,
): "tarlac" | "binan" | "neutral" => {
  const normalizedBranch = normalizeBranchName(branch)

  if (normalizedBranch === "tarlac") return "tarlac"
  if (normalizedBranch === "binan") return "binan"

  return "neutral"
}

export const formatBranchLabel = (branch: BranchBadgeValue) =>
  formatStatusLabel(branch.trim())
