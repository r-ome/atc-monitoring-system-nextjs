"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { InputNumber } from "@/app/components/ui/InputNumber";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { addExpense } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { toast } from "sonner";
import { formatDate } from "@/app/lib/utils";
import { PettyCash, EXPENSE_PURPOSE } from "src/entities/models/Expense";

interface AddExpenseModalProps {
  currentPettyCash: PettyCash | null;
  selectedBranch: { branch_id: string };
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  currentPettyCash,
  selectedBranch,
}) => {
  const router = useRouter();
  const { transaction_date } = useParams();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpenDialog] = useState<boolean>(false);
  const [purpose, setPurpose] = useState<(typeof EXPENSE_PURPOSE)[number] | "">("");

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setPurpose("");
    }
    setOpenDialog(next);
  };

  const PURPOSE_OPTIONS: {
    value: (typeof EXPENSE_PURPOSE)[number];
    label: string;
    description: string;
  }[] = [
    {
      value: "EXPENSE",
      label: "General Expense",
      description: "Supplies, utilities, repairs, fuel, or any operating cost.",
    },
    {
      value: "SALARY",
      label: "Pay Extra/Casual Worker",
      description:
        "Auction-day incentive or one-off payout to a non-employee helper.",
    },
    {
      value: "ADD_PETTY_CASH",
      label: "Add Petty Cash",
      description: "Top-up cash on hand for today's petty cash fund.",
    },
  ];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const currentTime = formatDate(new Date(), "HH:mm:ss");
    const formData = new FormData(event.currentTarget);
    formData.append("created_at", `${transaction_date}T${currentTime}`);
    const remarks = formData.get("remarks") as string;
    formData.set("remarks", remarks.toUpperCase());
    formData.append("branch_id", selectedBranch.branch_id);

    let pettyCashDate = null;
    let pettyCashId = "CREATE";
    if (currentPettyCash) {
      pettyCashDate = formatDate(
        new Date(currentPettyCash.created_at),
        "yyyy-MM-dd",
      );
      pettyCashId =
        pettyCashDate === transaction_date
          ? currentPettyCash.petty_cash_id
          : "CREATE";
    }

    const res = await addExpense(pettyCashId, formData);

    if (res) {
      setIsLoading(false);
      if (!res.ok) {
        toast.error(res.error?.message || "Failed to add expense.");
      } else {
        toast.success("Successfully added expense!");
        setOpenDialog(false);
        router.refresh();
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Add Expense</Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="purpose" className="w-40">
                Purpose
              </Label>
              <Select
                required
                name="purpose"
                value={purpose}
                onValueChange={(val: (typeof EXPENSE_PURPOSE)[number]) => {
                  setPurpose(val);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Purpose">
                    {purpose === ""
                      ? null
                      : PURPOSE_OPTIONS.find((o) => o.value === purpose)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {PURPOSE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex flex-col items-start py-0.5">
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground text-xs">
                            {opt.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {purpose !== "" && (
              <>
                <div className="flex gap-4">
                  <Label htmlFor="amount" className="w-40">
                    Amount
                  </Label>
                  <div className="w-full">
                    <InputNumber
                      name="amount"
                      min={0}
                      decimalScale={2}
                      autoComplete="off"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Label htmlFor="remarks" className="w-40">
                    Remarks
                  </Label>
                  <Textarea name="remarks" required />
                </div>
              </>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || purpose === ""}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
