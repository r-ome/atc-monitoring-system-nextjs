"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { formatDate } from "@/app/lib/utils";

const SUB_PAGE_LABELS: Record<string, string> = {
  "registered-bidders": "Registered Bidders",
  monitoring: "Monitoring",
  "counter-check": "Counter Check",
  payments: "Payments",
  manifest: "Manifest",
  receipt: "Receipt",
};

interface AuctionBreadcrumbProps {
  auctionDate: string;
}

export function AuctionBreadcrumb({ auctionDate }: AuctionBreadcrumbProps) {
  const pathname = usePathname();
  const base = `/auctions/${auctionDate}`;
  const dateLabel = formatDate(new Date(auctionDate), "MMM dd, yyyy");

  // Build breadcrumb segments after the base auction date path
  const after = pathname.slice(base.length).split("/").filter(Boolean);

  const crumbs: { label: string; href: string }[] = [
    { label: "Auctions", href: "/auctions" },
    { label: dateLabel, href: base },
  ];

  let builtHref = base;
  for (const segment of after) {
    builtHref = `${builtHref}/${segment}`;
    const label = SUB_PAGE_LABELS[segment] ?? `#${segment}`;
    crumbs.push({ label, href: builtHref });
  }

  if (crumbs.length <= 2) return null;

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={13} className="shrink-0" />}
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
