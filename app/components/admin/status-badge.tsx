import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"
import { type AuctionItemStatus } from "src/entities/models/Auction"
import { type ExpensePurpose } from "src/entities/models/Expense"
import { type InventoryStatus } from "src/entities/models/Inventory"
import {
  type BranchBadgeValue,
  formatAuctionStatusLabel,
  formatBranchLabel,
  formatExpenseTypeLabel,
  formatInventoryStatusLabel,
  getAuctionStatusVariant,
  getBranchBadgeVariant,
  getExpenseTypeVariant,
  getInventoryStatusVariant,
} from "./status-badge.helpers"

const statusBadgeVariants = cva(
  "inline-flex items-center rounded font-semibold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        // Payment statuses
        paid: "bg-status-success text-status-success-foreground",
        unpaid: "bg-status-error text-status-error-foreground",
        pending: "bg-status-warning text-status-warning-foreground",
        cancelled: "bg-muted text-muted-foreground",
        refunded: "bg-status-info text-status-info-foreground",

        // Activity statuses
        active: "bg-status-success text-status-success-foreground",
        inactive: "bg-status-error text-status-error-foreground",

        // Branch badges
        tarlac: "bg-branch-tarlac text-white",
        binan: "bg-branch-binan text-black",

        // Generic
        primary: "bg-primary text-primary-foreground",
        success: "bg-status-success text-status-success-foreground",
        warning: "bg-status-warning text-status-warning-foreground",
        error: "bg-status-error text-status-error-foreground",
        info: "bg-status-info text-status-info-foreground",
        neutral: "bg-muted text-muted-foreground",

        // Action badges
        pullout: "bg-status-success text-status-success-foreground",
        encoded: "bg-status-success text-status-success-foreground",
        duplicate: "bg-status-error text-status-error-foreground",
        addon: "bg-status-info text-status-info-foreground",
      },
      size: {
        sm: "px-1 py-0 text-[11px] 2xl:text-[13.5px]",
        default: "px-1.5 py-0.5 text-[12.5px] 2xl:text-[15.5px]",
        lg: "px-2 py-0.5 text-sm 2xl:text-base",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode
}

export function StatusBadge({
  className,
  variant,
  size,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(statusBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {children}
    </span>
  )
}

export function InventoryStatusBadge({
  status,
  className,
  size,
  ...props
}: Omit<StatusBadgeProps, "children" | "variant"> & {
  status: InventoryStatus
}) {
  return (
    <StatusBadge
      variant={getInventoryStatusVariant(status)}
      size={size}
      className={className}
      {...props}
    >
      {formatInventoryStatusLabel(status)}
    </StatusBadge>
  )
}

export function AuctionStatusBadge({
  status,
  className,
  size,
  ...props
}: Omit<StatusBadgeProps, "children" | "variant"> & {
  status: AuctionItemStatus
}) {
  return (
    <StatusBadge
      variant={getAuctionStatusVariant(status)}
      size={size}
      className={className}
      {...props}
    >
      {formatAuctionStatusLabel(status)}
    </StatusBadge>
  )
}

export function ExpenseTypeBadge({
  expenseType,
  className,
  size,
  ...props
}: Omit<StatusBadgeProps, "children" | "variant"> & {
  expenseType: ExpensePurpose
}) {
  return (
    <StatusBadge
      variant={getExpenseTypeVariant(expenseType)}
      size={size}
      className={className}
      {...props}
    >
      {formatExpenseTypeLabel(expenseType)}
    </StatusBadge>
  )
}

// Convenience components for common statuses
export function PaidBadge({ className, ...props }: Omit<StatusBadgeProps, "variant" | "children">) {
  return <StatusBadge variant="paid" className={className} {...props}>Paid</StatusBadge>
}

export function UnpaidBadge({ className, ...props }: Omit<StatusBadgeProps, "variant" | "children">) {
  return <StatusBadge variant="unpaid" className={className} {...props}>Unpaid</StatusBadge>
}

export function ActiveBadge({ className, ...props }: Omit<StatusBadgeProps, "variant" | "children">) {
  return <StatusBadge variant="active" className={className} {...props}>Active</StatusBadge>
}

export function InactiveBadge({ className, ...props }: Omit<StatusBadgeProps, "variant" | "children">) {
  return <StatusBadge variant="inactive" className={className} {...props}>Inactive</StatusBadge>
}

export function TarlacBadge({ className, ...props }: Omit<StatusBadgeProps, "variant" | "children">) {
  return <StatusBadge variant="tarlac" className={className} {...props}>Tarlac</StatusBadge>
}

export function BinanBadge({ className, ...props }: Omit<StatusBadgeProps, "variant" | "children">) {
  return <StatusBadge variant="binan" className={className} {...props}>Binan</StatusBadge>
}

// Branch badge — auction-style rectangular pill with branch-tinted background.
export function BranchBadge({
  branch,
  className,
  ...props
}: { branch: BranchBadgeValue } & Omit<StatusBadgeProps, "variant" | "children">) {
  const variant = getBranchBadgeVariant(branch)
  const background =
    variant === "binan"
      ? "var(--branch-binan)"
      : variant === "tarlac"
        ? "var(--branch-tarlac)"
        : undefined
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[12.5px] font-semibold uppercase tracking-wide text-secondary-foreground 2xl:text-[15.5px]",
        variant === "tarlac" && "text-white",
        variant === "neutral" && "bg-muted text-muted-foreground",
        className,
      )}
      style={background ? { background } : undefined}
      {...props}
    >
      {formatBranchLabel(branch)}
    </span>
  )
}

export { statusBadgeVariants }
