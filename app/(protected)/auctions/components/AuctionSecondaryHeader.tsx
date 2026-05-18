import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/app/components/ui/card";
import { BranchBadge } from "@/app/components/admin";
import { formatDate } from "@/app/lib/utils";

interface AuctionSecondaryHeaderProps {
  auctionDate: string;
  branchName: string;
  startedAt?: string | null;
  actions?: ReactNode;
}

export function AuctionSecondaryHeader({
  auctionDate,
  branchName,
  startedAt,
  actions,
}: AuctionSecondaryHeaderProps) {
  const dateObj = new Date(auctionDate);
  const dayOfWeek = formatDate(dateObj, "EEEE");
  const longDate = formatDate(dateObj, "MMMM d, yyyy");

  return (
    <Card className="flex flex-col gap-3 p-[14px] sm:flex-row sm:flex-wrap sm:items-center sm:justify-between 2xl:p-4 2xl:text-[15px]">
      <div className="flex min-w-0 flex-wrap items-center gap-2.5 sm:gap-3.5">
        <Link
          href={`/auctions/${auctionDate}`}
          aria-label="Back to auction overview"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <ChevronLeft size={16} />
        </Link>

        <div className="flex min-w-0 flex-col leading-tight">
          <span className="caps-label text-[10.5px] 2xl:text-[13px]">
            {dayOfWeek}
          </span>
          <span className="truncate text-[15px] font-semibold tracking-tight sm:text-[17px] 2xl:text-[21px]">
            {longDate}
          </span>
        </div>

        <BranchBadge branch={branchName} />

        {startedAt ? (
          <span className="text-[12px] text-muted-foreground 2xl:text-[14.5px]">
            Started {startedAt}
          </span>
        ) : null}
      </div>

      {actions ? (
        <div className="flex w-full flex-wrap items-center gap-2 [&>*]:flex-1 sm:w-auto sm:[&>*]:flex-initial">
          {actions}
        </div>
      ) : null}
    </Card>
  );
}
