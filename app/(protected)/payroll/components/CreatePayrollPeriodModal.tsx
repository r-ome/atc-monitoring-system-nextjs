"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { toast } from "sonner";
import { createPayrollPeriod } from "../actions";
import type { Branch } from "src/entities/models/Branch";
import { format, getDaysInMonth } from "date-fns";

interface Props {
  branches: Branch[];
  defaultBranchId: string;
  isAdmin: boolean;
}

function buildLabel(start: string, end: string): string {
  if (!start || !end) return "";
  try {
    const s = new Date(start + "T00:00:00");
    const e = new Date(end + "T00:00:00");
    return `${format(s, "MMMM d")}-${format(e, "d, yyyy")}`.toUpperCase();
  } catch {
    return "";
  }
}

function getHalfDates(year: number, month: number, half: "first" | "second") {
  if (half === "first") {
    return {
      start: format(new Date(year, month - 1, 1), "yyyy-MM-dd"),
      end: format(new Date(year, month - 1, 15), "yyyy-MM-dd"),
    };
  }
  const lastDay = getDaysInMonth(new Date(year, month - 1));
  return {
    start: format(new Date(year, month - 1, 16), "yyyy-MM-dd"),
    end: format(new Date(year, month - 1, lastDay), "yyyy-MM-dd"),
  };
}

export const CreatePayrollPeriodModal: React.FC<Props> = ({ branches, defaultBranchId, isAdmin }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [branchId, setBranchId] = useState(defaultBranchId);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [half, setHalf] = useState<"first" | "second">("first");

  const { start, end } = getHalfDates(year, month, half);
  const label = buildLabel(start, end);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("branch_id", branchId);
    fd.set("period_start", start);
    fd.set("period_end", end);
    fd.set("label", label);
    setIsLoading(true);
    try {
      const res = await createPayrollPeriod(fd);
      if (res.ok) {
        toast.success("Payroll period created!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Error creating period");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Period</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Payroll Period</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
            <div className="flex gap-4">
              <Label className="w-32 pt-2">Branch</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger className="w-full">
                  <SelectValue />
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
            </div>
          )}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label className="mb-1 block text-sm">Year</Label>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1 block text-sm">Month</Label>
              <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {months.map((m, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="mb-1 block text-sm">Half</Label>
              <Select value={half} onValueChange={(v: "first" | "second") => setHalf(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="first">1st (1–15)</SelectItem>
                    <SelectItem value="second">2nd (16–end)</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Period: </span>
            <span className="font-medium">{label || "—"}</span>
          </div>
          <div className="flex gap-4">
            <Label className="w-32 pt-2">Pay Date</Label>
            <Input type="date" name="pay_date" />
          </div>
          <div className="flex gap-4">
            <Label className="w-32 pt-2">Remarks</Label>
            <Textarea name="remarks" rows={2} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
