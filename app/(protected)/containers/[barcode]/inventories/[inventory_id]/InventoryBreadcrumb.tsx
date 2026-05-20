"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface InventoryBreadcrumbProps {
  containerBarcode: string;
  inventoryBarcode: string;
}

export function InventoryBreadcrumb({
  containerBarcode,
  inventoryBarcode,
}: InventoryBreadcrumbProps) {
  const crumbs = [
    { label: "Containers", href: "/containers" },
    { label: containerBarcode, href: `/containers/${containerBarcode}` },
    { label: inventoryBarcode, href: null },
  ];

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span
            key={`${crumb.label}-${i}`}
            className="flex items-center gap-1.5"
          >
            {i > 0 && <ChevronRight size={13} className="shrink-0" />}
            {isLast || !crumb.href ? (
              <span className="font-mono font-medium text-foreground">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className={
                  i === 0
                    ? "transition-colors hover:text-foreground"
                    : "font-mono transition-colors hover:text-foreground"
                }
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
