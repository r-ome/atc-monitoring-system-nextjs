"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Gavel,
  Users,
  Package,
  Building2,
  Container,
  Truck,
  BarChart3,
  HandCoins,
  Cog,
  UsersRound,
  LogOut,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { logSessionLogout } from "@/app/(protected)/session-actions";

const NAV_ITEMS = [
  { id: "home", label: "Home", href: "/home", icon: Home },
  { id: "auctions", label: "Auctions", href: "/auctions", icon: Gavel },
  { id: "bidders", label: "Bidders", href: "/bidders", icon: Users },
  { id: "items", label: "Bought Items", href: "/bought-items", icon: Package },
  { id: "branches", label: "Branches", href: "/branches", icon: Building2 },
  { id: "containers", label: "Containers", href: "/containers", icon: Container },
  { id: "suppliers", label: "Suppliers", href: "/suppliers", icon: Truck },
  { id: "transactions", label: "Transactions", href: "/transactions", icon: HandCoins },
  { id: "users", label: "Users", href: "/users", icon: UsersRound },
  { id: "reports", label: "Reports", href: "/reports", icon: BarChart3 },
  { id: "config", label: "Config", href: "/configurations", icon: Cog },
];

const MOBILE_TABS = [
  { id: "home", label: "Home", href: "/home", icon: Home },
  { id: "auctions", label: "Auctions", href: "/auctions", icon: Gavel },
  { id: "bidders", label: "Bidders", href: "/bidders", icon: Users },
  { id: "containers", label: "Containers", href: "/containers", icon: Container },
];

function RailItem({
  label,
  href,
  icon: Icon,
  active,
}: {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  active: boolean;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={href}
        className={cn(
          "flex w-12 h-[50px] flex-col items-center justify-center gap-[3px] rounded-[10px] border transition-colors duration-[120ms] text-[9.5px] font-medium",
          active
            ? "bg-card border-border text-primary shadow-xs"
            : "border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
        )}
      >
        <Icon size={18} />
        <span>{label.split(" ")[0].slice(0, 7)}</span>
      </Link>

      {hover && (
        <div className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-md">
          {label}
        </div>
      )}
    </div>
  );
}

interface RailNavProps {
  session: Session;
}

export function RailNav({ session }: RailNavProps) {
  const pathname = usePathname();
  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) ?? "?";

  return (
    <>
      {/* Desktop icon rail */}
      <aside className="hidden md:flex w-[68px] shrink-0 flex-col items-center border-r bg-background px-[10px] py-3 gap-1 h-screen sticky top-0">
        <div
          className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11.5px] font-bold tracking-tight text-white"
          style={{ background: "linear-gradient(135deg, var(--primary), oklch(0.35 0.18 256))" }}
        >
          ATC
        </div>

        {NAV_ITEMS.map((item) => (
          <RailItem
            key={item.id}
            label={item.label}
            href={item.href}
            icon={item.icon}
            active={pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href))}
          />
        ))}

        <div className="flex-1" />

        {/* Logout */}
        <button
          onClick={async () => {
            await logSessionLogout("manual");
            await signOut({ callbackUrl: "/login" });
          }}
          className="flex w-12 h-[50px] flex-col items-center justify-center gap-[3px] rounded-[10px] border border-transparent text-[9.5px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        {/* User avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {initials}
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around border-t bg-card px-1 pb-safe pt-1.5 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        {MOBILE_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href || (tab.href !== "/home" && pathname.startsWith(tab.href));
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={async () => {
            await logSessionLogout("manual");
            await signOut({ callbackUrl: "/login" });
          }}
          className="flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium text-muted-foreground"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </nav>
    </>
  );
}
