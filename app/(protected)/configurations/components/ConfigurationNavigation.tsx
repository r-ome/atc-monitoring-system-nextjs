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

export const ConfigurationNavigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const session = useSession();

  if (!session) return;

  const configurationNavigation = [
    {
      title: "Payment Methods",
      link: "payment-methods",
      description: "Add or Remove payment methods",
      not_allowed_roles: ["ENCODER"],
    },
  ];

  return (
    <div className="flex w-full gap-4 mt-4">
      {configurationNavigation.map((item, i) => (
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
