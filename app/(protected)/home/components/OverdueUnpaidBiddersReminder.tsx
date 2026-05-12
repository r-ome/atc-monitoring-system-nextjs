"use client";

import { useEffect, useMemo, useState } from "react";
import { isBefore, parseISO, subMonths } from "date-fns";
import { X } from "lucide-react";

import { getUnpaidBidders } from "@/app/(protected)/home/actions";
import { Button } from "@/app/components/ui/button";
import type { UnpaidBidders } from "src/entities/models/Statistics";

export function OverdueUnpaidBiddersReminder() {
  const [unpaid, setUnpaid] = useState<UnpaidBidders[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    getUnpaidBidders().then((result) => {
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setUnpaid(result.value);
    });
  }, []);

  const overdueBidders = useMemo(() => {
    const cutoff = subMonths(new Date(), 2);

    return unpaid
      .filter((bidder) => isBefore(parseISO(bidder.auction_date_iso), cutoff))
      .sort((a, b) => b.balance - a.balance);
  }, [unpaid]);

  if (error || overdueBidders.length === 0 || dismissed) return null;

  return (
    <blockquote className="relative rounded-md border border-l-4 border-border border-l-status-warning bg-status-warning/10 px-4 py-3 pr-10 text-sm 2xl:text-base">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss overdue bidder reminder"
        title="Dismiss reminder"
      >
        <X className="size-4" />
      </Button>
      <p className="font-semibold text-foreground">
        Reminder: Some bidders still have unpaid items that are more than 2 months overdue.
      </p>
    </blockquote>
  );
}
