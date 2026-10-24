"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/app/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { recalculateBidderStatuses } from "../actions";

type Props = {
  branches: { branch_id: string; name: string }[];
  currentBranchId: string;
  canSelectBranch: boolean;
};

export function RecalculateBidderStatusesButton({ branches, currentBranchId, canSelectBranch }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [branchId, setBranchId] = useState(branches.some(branch => branch.branch_id === currentBranchId) ? currentBranchId : "");
  const [error, setError] = useState<string>();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSelectBranch && !branchId) { setError("Select a branch."); return; }
    setLoading(true);
    setError(undefined);
    try {
      const result = await recalculateBidderStatuses(canSelectBranch ? branchId : undefined);
      if (!result.ok) { setError(result.error.message); return; }
      toast.success("Bidder statuses recalculated", {
        description: `Activated ${result.value.activated}; deactivated ${result.value.deactivated}.`,
      });
      setOpen(false);
      router.refresh();
    } catch {
      setError("Could not recalculate bidder statuses. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={value => { if (!loading) { setOpen(value); setError(undefined); } }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline"><RefreshCw className="size-4" />Recalculate status</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <form onSubmit={submit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Recalculate bidder statuses?</AlertDialogTitle>
            <AlertDialogDescription>
              Update active and inactive bidders using six months without activity. Banned bidders remain banned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {canSelectBranch && <div className="my-4 space-y-2">
            <Label htmlFor="recalculate-bidder-branch">Branch</Label>
            <Select value={branchId} onValueChange={value => { setBranchId(value); setError(undefined); }} disabled={loading}>
              <SelectTrigger id="recalculate-bidder-branch"><SelectValue placeholder="Select a branch" /></SelectTrigger>
              <SelectContent>{branches.map(branch => <SelectItem key={branch.branch_id} value={branch.branch_id}>{branch.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>}
          {error && <p role="alert" className="my-3 text-sm text-destructive">{error}</p>}
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <Button type="submit" disabled={loading || (canSelectBranch && !branchId)}>
              <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
              {loading ? "Recalculating…" : "Recalculate"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
