"use client";

import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { StepShell } from "../shared/StepShell";
import { StepProps } from "../shared/types";

export const AutoResolvedStep = ({
  preview,
  refresh,
  visibleSteps,
  goNext,
  goBack,
  goTo,
  jumpDisabled,
  setLoading,
  loading,
  state,
  saveDraft,
}: StepProps) => {
  if (!preview) return null;

  const items = preview.auto_resolved;

  const handleApply = async () => {
    if (!items.length) {
      goNext();
      return;
    }
    setLoading("Staging auto-resolved matches...");
    try {
      const stagedSources = new Set(
        state.draft.matches.map((m) => m.source_inventory_id),
      );
      const next = items
        .filter((c) => !stagedSources.has(c.unsold_item.inventory_id))
        .map((candidate) => ({
          auction_inventory_id: candidate.monitoring_item.auction_inventory_id,
          source_inventory_id: candidate.unsold_item.inventory_id,
          target_inventory_id: candidate.monitoring_item.inventory_id,
          price: candidate.monitoring_item.price,
          qty: candidate.monitoring_item.qty,
          description: candidate.unsold_item.description,
        }));
      await saveDraft({
        ...state.draft,
        matches: [...state.draft.matches, ...next],
      });
      toast.success(`Staged ${next.length} auto-resolved match(es).`);
      await refresh();
      goNext();
    } finally {
      setLoading(null);
    }
  };

  return (
    <StepShell
      step="auto-resolved"
      visibleSteps={visibleSteps}
      onBack={goBack}
      onJumpTo={goTo}
      jumpDisabled={jumpDisabled}
      onNext={handleApply}
      nextLabel="Save & Continue"
      loading={loading}
      description="High-confidence matches between UNSOLD inventory and 2-part monitoring rows. Review the list before applying."
    >
      <div className="border rounded max-h-[420px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>UNSOLD Barcode</TableHead>
              <TableHead>Ctrl</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Monitoring</TableHead>
              <TableHead>Bidder</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Reason</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-muted-foreground">
                  No auto-resolved matches.
                </TableCell>
              </TableRow>
            ) : (
              items.map((candidate) => (
                <TableRow key={candidate.candidate_id}>
                  <TableCell>{candidate.unsold_item.barcode}</TableCell>
                  <TableCell>{candidate.unsold_item.control}</TableCell>
                  <TableCell>{candidate.unsold_item.description}</TableCell>
                  <TableCell>{candidate.monitoring_item.barcode}</TableCell>
                  <TableCell>{candidate.monitoring_item.bidder_number}</TableCell>
                  <TableCell>
                    {candidate.monitoring_item.price.toLocaleString()}
                  </TableCell>
                  <TableCell>{candidate.reason}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </StepShell>
  );
};
