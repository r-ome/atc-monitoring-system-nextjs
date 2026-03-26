import Link from "next/link"
import { cn } from "@/app/lib/utils"
import { LucideIcon } from "lucide-react"

interface QuickNavItem {
  title: string
  description?: string
  href: string
  icon?: LucideIcon
}

interface QuickNavProps {
  items: QuickNavItem[]
  className?: string
  columns?: 2 | 3 | 4 | 5
}

export function QuickNav({ items, className, columns = 5 }: QuickNavProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  }

  return (
    <div className={cn("grid gap-3", gridCols[columns], className)}>
      {items.map((item) => (
        <QuickNavCard key={item.title} {...item} />
      ))}
    </div>
  )
}

interface QuickNavCardProps extends QuickNavItem {
  className?: string
}

export function QuickNavCard({
  title,
  description,
  href,
  icon: Icon,
  className,
}: QuickNavCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col gap-1 rounded-lg border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        )}
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </Link>
  )
}
