"use client";

import dynamic from "next/dynamic";
import { useState, type ReactNode } from "react";
import { Button } from "@/app/components/ui/button";

const AuctionBranchComparison = dynamic(() => import("./AuctionBranchComparison"), {
  loading: () => <p className="text-muted-foreground py-8 text-sm" role="status">Loading comparison…</p>,
});

interface Props {
  year: string;
  canCompare: boolean;
  selectedBranchContent: ReactNode;
}

export const AuctionReportsView = ({ year, canCompare, selectedBranchContent }: Props) => {
  const [view, setView] = useState<"selected" | "comparison">("selected");
  const [hasOpenedComparison, setHasOpenedComparison] = useState(false);

  if (!canCompare) return selectedBranchContent;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2" aria-label="Auction report view">
        <Button type="button" variant={view === "selected" ? "default" : "outline"}
          aria-pressed={view === "selected"} onClick={() => setView("selected")}>
          Selected branch
        </Button>
        <Button type="button" variant={view === "comparison" ? "default" : "outline"}
          aria-pressed={view === "comparison"} onClick={() => {
            setHasOpenedComparison(true);
            setView("comparison");
          }}>
          Compare branches
        </Button>
      </div>
      {view === "selected" && selectedBranchContent}
      {hasOpenedComparison && (
        <div hidden={view !== "comparison"}>
          <AuctionBranchComparison year={year} active={view === "comparison"} />
        </div>
      )}
    </div>
  );
};
