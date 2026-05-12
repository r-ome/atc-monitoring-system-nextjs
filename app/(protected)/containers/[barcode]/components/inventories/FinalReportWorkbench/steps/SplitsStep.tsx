"use client";

import { Checkbox } from "@/app/components/ui/checkbox";
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

export const SplitsStep = ({
  state,
  setState,
  preview,
  visibleSteps,
  goBack,
  goNext,
  goTo,
  jumpDisabled,
  loading,
  saveDraft,
}: StepProps) => {
  if (!preview) return null;
  const candidates = preview.split_candidates;

  const toggle = (id: string, checked: boolean) => {
    const nextSelections = checked
      ? state.splitSelections.includes(id)
        ? state.splitSelections
        : [...state.splitSelections, id]
      : state.splitSelections.filter((x) => x !== id);
    setState((prev) => ({ ...prev, splitSelections: nextSelections }));
    void saveDraft({ ...state.draft, split_selections: nextSelections });
  };

  return (
    <StepShell
      step="splits"
      visibleSteps={visibleSteps}
      onBack={goBack}
      onJumpTo={goTo}
      jumpDisabled={jumpDisabled}
      onNext={goNext}
      nextLabel="Save & Continue"
      loading={loading}
      description="Splits are applied to the generated workbook only — they do not change the database. Tick a row to split that monitoring entry's qty/price between the original and the UNSOLD item."
    >
      <div className="border rounded max-h-[420px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>UNSOLD Barcode</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Monitoring Ctrl</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground">
                  No split candidates.
                </TableCell>
              </TableRow>
            ) : (
              candidates.map((candidate) => (
                <TableRow key={candidate.candidate_id}>
                  <TableCell>
                    <Checkbox
                      checked={state.splitSelections.includes(
                        candidate.candidate_id,
                      )}
                      onCheckedChange={(checked) =>
                        toggle(candidate.candidate_id, checked === true)
                      }
                    />
                  </TableCell>
                  <TableCell>{candidate.unsold_item.barcode}</TableCell>
                  <TableCell>{candidate.unsold_item.description}</TableCell>
                  <TableCell>{candidate.monitoring_item.control}</TableCell>
                  <TableCell>{candidate.monitoring_item.qty}</TableCell>
                  <TableCell>
                    {candidate.monitoring_item.price.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </StepShell>
  );
};
