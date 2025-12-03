"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { SetStateAction, useEffect, useState } from "react";
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
import { updateExpense } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { toast } from "sonner";

// NOTES
// BALANCE PETTY CASH: Balance from yesterday
// PETTY CASH: amount that is added today
// TOTAL: Total of both

interface UpdateExpenseModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
  expense: {
    expense_id: string;
    amount: number;
    remarks: string;
    purpose: "EXPENSE" | "ADD_PETTY_CASH";
  };
}

export const UpdateExpenseModal = ({
  open,
  onOpenChange,
  expense,
}: UpdateExpenseModalProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedExpense, setSelectedExpense] =
    useState<UpdateExpenseModalProps["expense"]>(expense);

  useEffect(() => {
    setSelectedExpense(expense);
  }, [expense]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const res = await updateExpense(expense.expense_id, formData);

    if (res) {
      setIsLoading(false);
      if (!res.ok) {
        toast.error("");
      } else {
        toast.success("Successfully added expense!");
        onOpenChange(false);
        router.refresh();
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="amount" className="w-40">
                Amount
              </Label>
              <div className="w-full">
                <InputNumber
                  name="amount"
                  onChange={(e) =>
                    setSelectedExpense((prev) => ({
                      ...prev,
                      amount: parseInt(e.target.value, 10),
                    }))
                  }
                  min={0}
                  decimalScale={2}
                  value={selectedExpense?.amount ?? 0}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Label htmlFor="purpose" className="w-40">
                Purpose
              </Label>
              <Select
                required
                name="purpose"
                value={selectedExpense?.purpose}
                onValueChange={(purpose: "EXPENSE" | "ADD_PETTY_CASH") =>
                  setSelectedExpense((prev) => ({ ...prev, purpose }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Payment Type"></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {["EXPENSE", "ADD_PETTY_CASH"].map((item) => (
                      <SelectItem key={item} value={item}>
                        {item.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <Label htmlFor="remarks" className="w-40">
                Remarks
              </Label>
              <Textarea
                name="remarks"
                onChange={(e) =>
                  setSelectedExpense((prev) => ({
                    ...prev,
                    remarks: e.target.value.toUpperCase(),
                  }))
                }
                value={selectedExpense?.remarks}
                required
              ></Textarea>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={() => onOpenChange(false)}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
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
