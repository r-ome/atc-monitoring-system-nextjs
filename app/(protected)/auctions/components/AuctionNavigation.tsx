"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { QuickNav } from "@/app/components/admin";
import {
  UserCheck,
  BarChart3,
  ClipboardCheck,
  Receipt,
  FileText,
} from "lucide-react";

export const AuctionNavigation = () => {
  const pathname = usePathname();
  const session = useSession();

  if (!session.data) return null;

  const role = session.data.user.role as string;

  const auctionNavigation = [
    {
      title: "Registered Bidders",
      href: `${pathname}/registered-bidders`,
      description: "Registered Bidders and their balances",
      icon: UserCheck,
      not_allowed_roles: ["ENCODER"],
    },
    {
      title: "Monitoring",
      href: `${pathname}/monitoring`,
      description: "Monitoring Page",
      icon: BarChart3,
    },
    {
      title: "Counter Check",
      href: `${pathname}/counter-check`,
      description: "Counter Check details",
      icon: ClipboardCheck,
    },
    {
      title: "Payments",
      href: `${pathname}/payments`,
      description: "Bidder's balances and settle of payments",
      icon: Receipt,
      not_allowed_roles: ["ENCODER"],
    },
    {
      title: "Manifest",
      href: `${pathname}/manifest`,
      description: "List of manifest records",
      icon: FileText,
    },
  ];

  const filteredItems = auctionNavigation.filter(
    (item) => !("not_allowed_roles" in item && item.not_allowed_roles?.includes(role))
  );

  return <QuickNav items={filteredItems} columns={5} />;
};
