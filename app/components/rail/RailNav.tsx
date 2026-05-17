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
  Banknote,
  LogOut,
  Menu,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { logSessionLogout } from "@/app/(protected)/session-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/app/components/ui/sheet";

const NAV_ITEMS = [
  { id: "home", label: "Home", href: "/home", icon: Home, roles: ["OWNER", "SUPER_ADMIN", "CASHIER", "ENCODER"] },
  { id: "auctions", label: "Auctions", href: "/auctions", icon: Gavel, roles: ["OWNER", "SUPER_ADMIN", "CASHIER", "ENCODER"] },
  { id: "bidders", label: "Bidders", href: "/bidders", icon: Users, roles: ["OWNER", "SUPER_ADMIN", "CASHIER"] },
  { id: "items", label: "Bought Items", href: "/bought-items", icon: Package, roles: ["OWNER", "SUPER_ADMIN", "CASHIER"] },
  { id: "branches", label: "Branches", href: "/branches", icon: Building2, roles: ["OWNER", "SUPER_ADMIN"] },
  { id: "containers", label: "Containers", href: "/containers", icon: Container, roles: ["OWNER", "SUPER_ADMIN", "CASHIER"] },
  { id: "suppliers", label: "Suppliers", href: "/suppliers", icon: Truck, roles: ["OWNER", "SUPER_ADMIN"] },
  { id: "payroll", label: "Payroll", href: "/payroll", icon: Banknote, roles: ["OWNER", "SUPER_ADMIN", "CASHIER"] },
  { id: "transactions", label: "Transactions", href: "/transactions", icon: HandCoins, roles: ["OWNER", "SUPER_ADMIN", "CASHIER"] },
  { id: "users", label: "Users", href: "/users", icon: UsersRound, roles: ["OWNER", "SUPER_ADMIN"] },
  { id: "reports", label: "Reports", href: "/reports", icon: BarChart3, roles: ["OWNER", "SUPER_ADMIN", "CASHIER", "MODERATOR"] },
  { id: "config", label: "Config", href: "/configurations", icon: Cog, roles: ["OWNER", "SUPER_ADMIN", "CASHIER"] },
];

const MOBILE_TABS = [
  { id: "home", label: "Home", href: "/home", icon: Home, roles: ["OWNER", "SUPER_ADMIN", "CASHIER", "ENCODER"] },
  { id: "auctions", label: "Auctions", href: "/auctions", icon: Gavel, roles: ["OWNER", "SUPER_ADMIN", "CASHIER", "ENCODER"] },
  { id: "bidders", label: "Bidders", href: "/bidders", icon: Users, roles: ["OWNER", "SUPER_ADMIN", "CASHIER"] },
  { id: "containers", label: "Containers", href: "/containers", icon: Container, roles: ["OWNER", "SUPER_ADMIN", "CASHIER"] },
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
          "flex w-12 h-[50px] flex-col items-center justify-center gap-[3px] rounded-[10px] border transition-colors duration-[120ms] text-[9.5px] font-medium 2xl:text-[13.5px]",
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const initials = session.user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2) ?? "?";

  const mobileTabs = MOBILE_TABS.filter((t) =>
    t.roles.includes(session.user.role),
  );
  const mobileTabIds = new Set(mobileTabs.map((t) => t.id));
  const drawerItems = NAV_ITEMS.filter(
    (item) =>
      !mobileTabIds.has(item.id) && item.roles.includes(session.user.role),
  );

  const handleLogout = async () => {
    await logSessionLogout("manual");
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      {/* Desktop icon rail */}
      <aside className="hidden md:flex w-[74px] shrink-0 flex-col items-center border-r bg-background px-[10px] py-3 gap-1 h-screen sticky top-0">
        <div
          className="mb-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11.5px] font-bold tracking-tight text-white 2xl:text-[15.5px]"
          style={{ background: "linear-gradient(135deg, var(--primary), oklch(0.35 0.18 256))" }}
        >
          ATC
        </div>

        {NAV_ITEMS.filter((item) => item.roles.includes(session.user.role)).map((item) => (
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
          onClick={handleLogout}
          className="flex w-12 h-[50px] flex-col items-center justify-center gap-[3px] rounded-[10px] border border-transparent text-[9.5px] font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors 2xl:text-[13.5px]"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>

        {/* User avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground 2xl:text-[15px]">
          {initials}
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex justify-around border-t bg-card px-1 pb-safe pt-1.5 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
        {mobileTabs.map((tab) => {
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
          type="button"
          onClick={() => setDrawerOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-medium",
            drawerOpen ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="left"
          className="w-[280px] p-0 flex flex-col gap-0"
        >
          <SheetHeader className="border-b px-4 py-3 flex-row items-center gap-3 space-y-0">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[12px] font-bold tracking-tight text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary), oklch(0.35 0.18 256))",
              }}
            >
              {initials}
            </div>
            <div className="flex min-w-0 flex-col leading-tight text-left">
              <SheetTitle className="truncate text-[13.5px] font-semibold">
                {session.user.name ?? "User"}
              </SheetTitle>
              <SheetDescription className="text-[11px] text-muted-foreground">
                {session.user.role}
              </SheetDescription>
            </div>
          </SheetHeader>

          <nav className="flex-1 overflow-y-auto px-2 py-3">
            <ul className="flex flex-col gap-0.5">
              {drawerItems.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.href ||
                  (item.href !== "/home" && pathname.startsWith(item.href));
                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors",
                        active
                          ? "bg-secondary text-foreground"
                          : "text-foreground/80 hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      <Icon size={16} className="text-muted-foreground" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t px-2 py-3">
            <button
              type="button"
              onClick={async () => {
                setDrawerOpen(false);
                await handleLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13.5px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
