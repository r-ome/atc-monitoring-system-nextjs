"use client";

import React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbSeparator,
} from "@/app/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

interface AppBreadcrumbProps {
  branch?: string | null;
}

export const AppBreadcrumb: React.FC<AppBreadcrumbProps> = ({ branch }) => {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          ({branch === "ALL" ? "ADMIN" : branch})
          {segments.map((segment, index) => {
            const href = "/" + segments.slice(0, index + 1).join("/");
            const isLast = index === segments.length - 1;
            const label = decodeURI(segment).toUpperCase();

            return (
              <React.Fragment key={href}>
                <BreadcrumbItem className="hidden md:block">
                  <Link href={href}>
                    {label.slice(0, 10)} {label.length > 10 ? "..." : null}
                  </Link>
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};
