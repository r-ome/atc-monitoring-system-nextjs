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
    <div className="flex w-full gap-4 mt-4">
      {auctionNavigation.map((item, i) => (
        <Card
          className={cn(
            "w-full cursor-pointer shadow-sm hover:shadow-md",
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
