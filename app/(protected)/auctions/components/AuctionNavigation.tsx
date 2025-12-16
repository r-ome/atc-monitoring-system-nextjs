"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";

export const AuctionNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();

  if (!session) return;

  const auctionNavigation = [
    {
      title: "Registered Bidders",
      link: "registered-bidders",
      description: "Registered Bidders and their balances",
      not_allowed_roles: ["ENCODER"],
    },
    {
      title: "Monitoring",
      link: "monitoring",
      description: "Monitoring Page",
    },
    {
      title: "Counter Check",
      link: "counter-check",
      description: "Counter Check details",
    },
    {
      title: "Payments",
      link: "payments",
      description: "Bidder's balances and settle of payments",
      not_allowed_roles: ["ENCODER"],
    },
    {
      title: "Manifest",
      link: "manifest",
      description: "List of manifest records",
    },
  ];

  return (
    <div className="flex flex-col gap-y-2 md:flex-row md:gap-2 mt-4 w-full">
      {auctionNavigation.map((item, i) => (
        <Card
          className={cn(
            "w-full cursor-pointer shadow-sm hover:shadow-lg",
            item.not_allowed_roles?.includes(
              session.data?.user.role as string
            ) && "hidden"
          )}
          key={i}
          onClick={() => router.push(`${pathname}/${item.link}`)}
        >
          <CardHeader>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};
