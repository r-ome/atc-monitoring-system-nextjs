import type { ReactNode } from "react";
import { Card } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";

interface AuctionMiniStatProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  danger?: boolean;
}

export function AuctionMiniStat({
  label,
  value,
  sub,
  danger,
}: AuctionMiniStatProps) {
  return (
    <Card className="flex min-w-0 flex-col gap-1 p-[14px] 2xl:p-4 2xl:text-[15px]">
      <span className="caps-label text-[11px] 2xl:text-[13px]">{label}</span>
      <span
        className={cn(
          "font-mono truncate text-[17px] font-semibold tracking-tight sm:text-[20px] 2xl:text-[24px]",
          danger ? "text-destructive" : "text-foreground",
        )}
      >
        {value}
      </span>
      {sub ? (
        <span className="text-[11.5px] text-muted-foreground 2xl:text-[14px]">
          {sub}
        </span>
      ) : null}
    </Card>
  );
}
