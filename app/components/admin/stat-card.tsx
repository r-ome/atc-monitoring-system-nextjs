import { cn } from "@/app/lib/utils"
import { Card, CardContent } from "@/app/components/ui/card"
import { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  className?: string
  variant?: "default" | "primary" | "success" | "warning" | "error"
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = "default",
}: StatCardProps) {
  const variantStyles = {
    default: "border-border",
    primary: "border-primary/20 bg-primary/5",
    success: "border-status-success/20 bg-status-success/5",
    warning: "border-status-warning/20 bg-status-warning/5",
    error: "border-status-error/20 bg-status-error/5",
  }

  const iconStyles = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-status-success",
    warning: "text-status-warning",
    error: "text-status-error",
  }

  return (
    <Card className={cn("relative overflow-hidden", variantStyles[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 pt-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-status-success" : "text-status-error"
                  )}
                >
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-xs text-muted-foreground">
                    {trend.label}
                  </span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("rounded-lg p-2.5 bg-muted/50", iconStyles[variant])}>
              <Icon className="size-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface StatCardGroupProps {
  children: React.ReactNode
  className?: string
  columns?: 2 | 3 | 4 | 5
}

export function StatCardGroup({ children, className, columns = 4 }: StatCardGroupProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-5",
  }

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  )
}
