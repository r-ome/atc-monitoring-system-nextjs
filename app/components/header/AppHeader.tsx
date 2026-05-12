"use client";

import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import type { Session } from "next-auth";
import { ThemeToggle } from "@/app/components/admin/theme-toggle";
import { Button } from "@/app/components/ui/button";

interface AppHeaderProps {
  session: Session;
}

export function AppHeader({ session }: AppHeaderProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const initials =
    session.user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2) ?? "?";

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-card px-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground 2xl:text-[17px]">
        <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-secondary text-secondary-foreground 2xl:text-[14px]">
          {session.user.role}
        </span>
        <span>/</span>
        <span className="font-medium text-foreground">
          {session.user.branch?.name ?? "Global"}
        </span>
      </div>

      {/* Search trigger */}
      <div className="mx-auto hidden max-w-[480px] flex-1 md:flex">
        <button
          className="flex w-full items-center gap-2 rounded-md border bg-secondary px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-secondary/80"
          onClick={() => {
            const event = new KeyboardEvent("keydown", {
              key: "k",
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
        >
          <Search size={14} />
          <span className="flex-1 text-left">
            Search items by barcode, control, or description…
          </span>
          <kbd className="rounded border bg-background px-1.5 py-0.5 text-[11px] font-medium">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden flex-col text-right leading-tight md:flex">
          <span className="text-[12.5px] font-medium text-secondary-foreground 2xl:text-[16.5px]">
            {now ? format(now, "EEEE, MMM d, yyyy") : ""}
          </span>
          <span className="font-mono text-[11px] text-muted-foreground 2xl:text-[15px]">
            {now ? format(now, "hh:mm:ss aa") : ""}
          </span>
        </div>

        <Button variant="ghost" size="icon" className="size-8">
          <Bell size={16} />
        </Button>

        <ThemeToggle />

        {/* User chip */}
        <div className="flex cursor-pointer items-center gap-2 rounded-full bg-secondary px-2 py-1">
          <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground 2xl:text-[15px]">
            {initials}
          </div>
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-[12.5px] font-medium 2xl:text-[16.5px]">{session.user.name}</span>
            <span className="text-[10.5px] text-muted-foreground 2xl:text-[14.5px]">
              {session.user.role}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
