"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/app/lib/utils";

type SectionTab = {
  id: string;
  label: string;
  segment: string | null;
  not_allowed_roles?: string[];
};

const TABS: SectionTab[] = [
  { id: "overview", label: "Overview", segment: null },
  {
    id: "registered-bidders",
    label: "Registered Bidders",
    segment: "registered-bidders",
    not_allowed_roles: ["ENCODER"],
  },
  { id: "monitoring", label: "Monitoring", segment: "monitoring" },
  { id: "counter-check", label: "Counter Check", segment: "counter-check" },
  {
    id: "payments",
    label: "Payments",
    segment: "payments",
    not_allowed_roles: ["ENCODER"],
  },
  { id: "manifest", label: "Manifest", segment: "manifest" },
];

interface AuctionSectionNavProps {
  basePath: string;
}

export function AuctionSectionNav({ basePath }: AuctionSectionNavProps) {
  const pathname = usePathname();
  const session = useSession();
  const role = session.data?.user.role as string | undefined;

  if (!session.data) return null;

  const tabs = TABS.filter(
    (t) => !t.not_allowed_roles?.includes(role ?? ""),
  );

  return (
    <div
      className="flex gap-1 overflow-x-auto rounded-lg border bg-secondary/60 p-1"
      role="tablist"
    >
      {tabs.map((tab) => {
        const href = tab.segment ? `${basePath}/${tab.segment}` : basePath;
        const isActive = tab.segment
          ? pathname === href || pathname.startsWith(`${href}/`)
          : pathname === basePath;

        return (
          <Link
            key={tab.id}
            href={href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-[13px] font-medium transition-colors sm:px-3 sm:py-1.5 2xl:text-[15px]",
              isActive
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
