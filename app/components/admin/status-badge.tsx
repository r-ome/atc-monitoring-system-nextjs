import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/app/lib/utils"

const statusBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors",
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
        sm: "px-2 py-0.5 text-[10px]",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
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

// Branch badge helper
export function BranchBadge({ branch, className, ...props }: { branch: "tarlac" | "binan" } & Omit<StatusBadgeProps, "variant" | "children">) {
  return (
    <StatusBadge
      variant={branch}
      className={className}
      {...props}
    >
      {branch === "tarlac" ? "Tarlac" : "Binan"}
    </StatusBadge>
  )
}

export { statusBadgeVariants }
