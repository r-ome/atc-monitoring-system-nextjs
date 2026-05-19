"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SupplierBreadcrumbProps {
  supplierCode: string;
  supplierName: string;
}

export function SupplierBreadcrumb({
  supplierCode,
  supplierName,
}: SupplierBreadcrumbProps) {
  const crumbs = [
    { label: "Suppliers", href: "/suppliers" },
    {
      label: `${supplierName} (${supplierCode})`,
      href: `/suppliers/${supplierCode}`,
    },
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
