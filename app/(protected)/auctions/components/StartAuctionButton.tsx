"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { startAuction } from "@/app/(protected)/auctions/actions";
import { toast } from "sonner";
import { getBranches } from "@/app/(protected)/branches/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";

export const StartAuctionButton = ({ requiresBranchSelection = false }: { requiresBranchSelection?: boolean }) => {
  const router = useRouter();
  const { auction_date }: { auction_date: string } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState<{ branch_id: string; name: string }[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open || !requiresBranchSelection) return;
    let cancelled = false;
    getBranches().then((result) => {
      if (cancelled) return;
      if (result.ok) setBranches(result.value.filter((branch) => !branch.deleted_at && branch.name !== "ALL"));
      else setError(result.error.message);
    }).catch(() => { if (!cancelled) setError("Could not load branches. Try again."); });
    return () => { cancelled = true; };
  }, [open, requiresBranchSelection]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (requiresBranchSelection && !branchId) { setError("Select an auction branch."); return; }
    setIsLoading(true);
    setError(undefined);
    try {
      const res = await startAuction(auction_date, requiresBranchSelection ? branchId : undefined);
      if (res.ok) {
        toast.success("Successfully created an auction!", { description: res.value.bidder_activity
          ? `Activated ${res.value.bidder_activity.activated}; deactivated ${res.value.bidder_activity.deactivated}.`
          : undefined });
        setOpen(false);
        router.refresh();
      } else {
        setError(res.error.message);
      }
    } catch {
      setError("Could not start the auction. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!isLoading) { setOpen(next); setError(undefined); } }}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Click here to start Auction today!</Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <form onSubmit={handleSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Once you click submit an auction will be started.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {requiresBranchSelection && (
            <div className="my-4 space-y-2">
              <Label htmlFor="auction-start-branch">Branch</Label>
              <Select value={branchId} onValueChange={(value) => { setBranchId(value); setError(undefined); }} disabled={isLoading}>
                <SelectTrigger id="auction-start-branch"><SelectValue placeholder="Select a branch" /></SelectTrigger>
                <SelectContent>{branches.map((branch) => <SelectItem key={branch.branch_id} value={branch.branch_id}>{branch.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          {error && <p role="alert" className="my-3 text-sm text-destructive">{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <Button type="submit" disabled={isLoading || (requiresBranchSelection && !branchId)}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
