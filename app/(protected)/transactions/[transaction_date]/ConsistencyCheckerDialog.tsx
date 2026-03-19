"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { format, startOfMonth } from "date-fns";
import { Loader2Icon, CheckCircle2Icon, OctagonAlert } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { cn } from "@/app/lib/utils";
import { toast } from "sonner";
import { getBranches } from "@/app/(protected)/branches/actions";
import {
  checkPettyCashConsistency,
  repairPettyCashConsistency,
  undoPettyCashRepair,
} from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import type {
  ConsistencyIssue,
  PettyCashSnapshot,
  RepairResult,
} from "src/entities/models/Expense";

type Mode = "month" | "custom";
type Branch = { branch_id: string; name: string };

const ALLOWED_ROLES = ["SUPER_ADMIN", "OWNER", "CASHIER"];
const BRANCH_TOGGLE_ROLES = ["SUPER_ADMIN", "OWNER"];

export const ConsistencyCheckerDialog: React.FC = () => {
  const { data: session } = useSession();
  const today = format(new Date(), "yyyy-MM-dd");

  const canToggleBranch = session?.user
    ? BRANCH_TOGGLE_ROLES.includes(session.user.role)
    : true;
  const userBranch = session?.user?.branch;

  const [open, setOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [isFetchingBranches, setIsFetchingBranches] = useState(false);
  const [mode, setMode] = useState<Mode>("month");
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);
  const [isChecking, setIsChecking] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [isUndoing, setIsUndoing] = useState(false);
  const [issues, setIssues] = useState<ConsistencyIssue[] | null>(null);
  const [repairResult, setRepairResult] = useState<RepairResult | null>(null);
  const [snapshot, setSnapshot] = useState<PettyCashSnapshot | null>(null);
  const [checked, setChecked] = useState(false);

  if (!session?.user || !ALLOWED_ROLES.includes(session.user.role)) return null;

  const getDateRange = (): { start: string; end: string } => {
    if (mode === "month") {
      const date = new Date(`${today}T12:00:00`);
      return { start: format(startOfMonth(date), "yyyy-MM-dd"), end: today };
    }
    return { start: customStart, end: customEnd };
  };

  const resetResults = () => {
    setIssues(null);
    setRepairResult(null);
    setSnapshot(null);
    setChecked(false);
  };

  const handleOpen = async () => {
    setOpen(true);
    if (!canToggleBranch) {
      if (userBranch) setSelectedBranchId(userBranch.branch_id);
      return;
    }
    if (branches.length > 0) return;

    setIsFetchingBranches(true);
    const res = await getBranches();
    setIsFetchingBranches(false);

    if (!res.ok) {
      toast.error("Failed to load branches.");
      return;
    }
    setBranches(res.value);
    if (res.value.length > 0) setSelectedBranchId(res.value[0].branch_id);
  };

  const handleCheck = async () => {
    if (!selectedBranchId) return;
    setIsChecking(true);
    resetResults();

    const { start, end } = getDateRange();
    const res = await checkPettyCashConsistency(selectedBranchId, start, end);

    setIsChecking(false);
    setChecked(true);

    if (!res.ok) {
      toast.error("Failed to check consistency.");
      return;
    }
    setIssues(res.value);
  };

  const handleRepair = async () => {
    if (!selectedBranchId) return;
    setIsRepairing(true);

    const { start, end } = getDateRange();
    const res = await repairPettyCashConsistency(selectedBranchId, start, end);

    setIsRepairing(false);

    if (!res.ok) {
      toast.error("Failed to repair consistency.");
      return;
    }

    if (!res.value) {
      toast.info("No inconsistencies found — nothing to repair.");
      setIssues([]);
      return;
    }

    setRepairResult(res.value);
    setSnapshot(res.value.snapshot);
    setIssues([]);
    toast.success("Repair complete.");
  };

  const handleUndo = async () => {
    if (!snapshot) return;
    setIsUndoing(true);

    const res = await undoPettyCashRepair(snapshot);

    setIsUndoing(false);

    if (!res.ok) {
      toast.error("Failed to undo repair.");
      return;
    }

    setRepairResult(null);
    setSnapshot(null);
    setChecked(false);
    toast.success("Repair undone.");
  };

  const handleClose = () => {
    if (repairResult) {
      const confirmed = window.confirm(
        "Closing will discard the undo option. Are you sure?",
      );
      if (!confirmed) return;
    }
    setOpen(false);
    resetResults();
    setMode("month");
    if (canToggleBranch) setSelectedBranchId("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      handleClose();
      return;
    }
    setOpen(true);
  };

  const selectedBranch = canToggleBranch
    ? branches.find((b) => b.branch_id === selectedBranchId)
    : userBranch ?? undefined;

  return (
    <>
      <Button variant="outline" onClick={handleOpen}>
        Check Consistency
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-2xl"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleClose();
          }}
        >
          <DialogHeader>
            <DialogTitle>Petty Cash Consistency Check</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Branch selector — hidden for CASHIER */}
            {canToggleBranch && (
              <div className="flex flex-col gap-1">
                <Label>Branch</Label>
                {isFetchingBranches ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Loading branches...
                  </div>
                ) : (
                  <Select
                    value={selectedBranchId}
                    onValueChange={(val) => {
                      setSelectedBranchId(val);
                      resetResults();
                    }}
                  >
                    <SelectTrigger className="w-60">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {branches.map((b) => (
                          <SelectItem key={b.branch_id} value={b.branch_id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Date range selector */}
            <div className="flex gap-2">
              {(["month", "custom"] as Mode[]).map((m) => (
                <Button
                  key={m}
                  size="sm"
                  variant={mode === m ? "default" : "outline"}
                  onClick={() => {
                    setMode(m);
                    resetResults();
                  }}
                >
                  {m === "month" ? "This Month" : "Custom"}
                </Button>
              ))}
            </div>

            {mode === "custom" && (
              <div className="flex gap-6 items-end">
                <div className="flex flex-col gap-1">
                  <Label>From</Label>
                  <input
                    type="date"
                    value={customStart}
                    max={customEnd}
                    onChange={(e) => {
                      setCustomStart(e.target.value);
                      resetResults();
                    }}
                    className="border rounded-md px-3 py-1.5 text-sm bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label>To</Label>
                  <input
                    type="date"
                    value={customEnd}
                    min={customStart}
                    max={today}
                    onChange={(e) => {
                      setCustomEnd(e.target.value);
                      resetResults();
                    }}
                    className="border rounded-md px-3 py-1.5 text-sm bg-background"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={handleCheck}
              disabled={isChecking || !selectedBranchId}
            >
              {isChecking && (
                <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
              )}
              {isChecking ? "Checking..." : "Check"}
            </Button>

            {/* Results */}
            {checked && issues !== null && issues.length === 0 && !repairResult && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2Icon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  All petty cash records are consistent
                  {selectedBranch ? ` for ${selectedBranch.name}` : ""}.
                </span>
              </div>
            )}

            {checked && issues !== null && issues.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <OctagonAlert className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    {issues.length} inconsistent day(s) found
                  </span>
                </div>

                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted text-muted-foreground">
                        <th className="text-left px-3 py-2 font-medium">Day</th>
                        <th className="text-right px-3 py-2 font-medium">Stored</th>
                        <th className="text-right px-3 py-2 font-medium">Expected</th>
                        <th className="text-right px-3 py-2 font-medium">Drift</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map((issue, index) => (
                        <tr key={`${issue.day}-${index}`} className="border-t">
                          <td className="px-3 py-2">{issue.day}</td>
                          <td className="text-right px-3 py-2">
                            ₱{issue.stored.toLocaleString()}
                          </td>
                          <td className="text-right px-3 py-2">
                            ₱{issue.expected.toLocaleString()}
                          </td>
                          <td
                            className={cn(
                              "text-right px-3 py-2 font-medium",
                              issue.drift < 0 ? "text-red-500" : "text-amber-500",
                            )}
                          >
                            {issue.drift > 0 ? "+" : ""}₱
                            {Math.abs(issue.drift).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleRepair}
                  disabled={isRepairing}
                >
                  {isRepairing && (
                    <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
                  )}
                  {isRepairing ? "Repairing..." : "Repair"}
                </Button>
              </div>
            )}

            {repairResult && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Repaired from {repairResult.repaired_from} —{" "}
                    {repairResult.days_fixed} day(s) fixed.
                  </span>
                </div>
                <Button
                  variant="outline"
                  onClick={handleUndo}
                  disabled={isUndoing}
                >
                  {isUndoing && (
                    <Loader2Icon className="animate-spin mr-2 h-4 w-4" />
                  )}
                  {isUndoing ? "Undoing..." : "Undo Repair"}
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
