"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatDate } from "@/app/lib/utils";

interface ActivityLogsBreadcrumbProps {
  date: string;
}

export function ActivityLogsBreadcrumb({ date }: ActivityLogsBreadcrumbProps) {
  const dateLabel = formatDate(new Date(date), "MMM dd, yyyy");

  const crumbs = [
    { label: "Configurations", href: "/configurations" },
    { label: "Activity Logs", href: "/configurations/activity-logs" },
    { label: dateLabel, href: `/configurations/activity-logs/${date}` },
  ];

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="shrink-0" />}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
