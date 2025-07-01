export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Box,
  Users,
  Warehouse,
  Container,
  ShieldUser,
  Gavel,
  UsersRound,
  HandCoins,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/app/components/ui/sidebar";
import { LogoutButton } from "./LogoutButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { cn } from "@/app/lib/utils";

const items = [
  // {
  //   title: "Home",
  //   url: "/",
  //   icon: Home,
  // },
  {
    title: "Auctions",
    url: "/auctions",
    icon: Gavel,
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
];

export async function AppSideBar() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex justify-center">ATC Monitoring System</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem
              key={item.title}
              className={cn(
                "hover:underline",
                !item.allowed_roles.includes(session.user.role) && "hidden"
              )}
            >
              <SidebarMenuButton asChild className="text-lg">
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
      </SidebarContent>
    </Sidebar>
  );
}
