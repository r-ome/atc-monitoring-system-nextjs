"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type Session } from "next-auth";
import { LogoutButton } from "./LogoutButton";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/app/components/ui/sidebar";
import {
  Box,
  Users,
  Warehouse,
  Container,
  ShieldUser,
  Gavel,
  Home,
  UsersRound,
  HandCoins,
  Cog,
  List,
  ChartPie,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
    allowed_roles: ["OWNER", "SUPER_ADMIN", "CASHIER", "ENCODER"],
  },
  {
    title: "Auctions",
    url: "/auctions",
    icon: Gavel,
    allowed_roles: ["OWNER", "SUPER_ADMIN", "CASHIER", "ENCODER"],
  },
  {
    title: "Monitoring",
    url: "/monitoring-all",
    icon: List,
    allowed_roles: ["OWNER", "SUPER_ADMIN", "CASHIER", "ENCODER"],
  },
  {
    title: "Bidders",
    url: "/bidders",
    icon: Users,
    allowed_roles: ["OWNER", "SUPER_ADMIN", "CASHIER"],
  },
  {
    title: "Bought Items",
    url: "/bought-items",
    icon: Box,
    allowed_roles: ["OWNER", "SUPER_ADMIN", "CASHIER"],
  },
  {
    title: "Branches",
    url: "/branches",
    icon: Warehouse,
    allowed_roles: ["OWNER", "SUPER_ADMIN"],
  },
  {
    title: "Containers",
    url: "/containers",
    icon: Container,
    allowed_roles: ["OWNER", "SUPER_ADMIN", "CASHIER"],
  },
  {
    title: "Suppliers",
    url: "/suppliers",
    icon: ShieldUser,
    allowed_roles: ["OWNER", "SUPER_ADMIN"],
  },
  {
    title: "Users",
    url: "/users",
    icon: UsersRound,
    allowed_roles: ["OWNER", "SUPER_ADMIN"],
  },
  {
    title: "Transactions",
    url: "/transactions",
    icon: HandCoins,
    allowed_roles: ["OWNER", "SUPER_ADMIN", "CASHIER"],
  },
  {
    title: "Configurations",
    url: "/configurations",
    icon: Cog,
    allowed_roles: ["OWNER", "SUPER_ADMIN", "CASHIER"],
  },
  {
    title: "Reports",
    url: "/reports",
    icon: ChartPie,
    allowed_roles: ["OWNER", "SUPER_ADMIN"],
  },
];

interface AppSidebarMenuProps {
  session: Session | null;
}

export const AppSidebarMenu = ({ session }: AppSidebarMenuProps) => {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();

  if (!session) {
    router.push("/login");
    return;
  }

  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem
          key={item.title}
          className={cn(
            "hover:underline",
            !item.allowed_roles.includes(session.user.role) && "hidden",
          )}
        >
          <SidebarMenuButton
            asChild
            className="text-lg"
            onClick={() => toggleSidebar()}
          >
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
      <SidebarMenuItem className="hover:underline">
        <SidebarMenuButton asChild className="text-lg">
          <LogoutButton />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
