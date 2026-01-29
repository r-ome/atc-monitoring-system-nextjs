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
import { Textarea } from "@/app/components/ui/textarea";
import { updatePettyCash } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { toast } from "sonner";
import { formatDate } from "@/app/lib/utils";
import { PettyCash } from "src/entities/models/Expense";

// NOTES
// BALANCE PETTY CASH: Balance from yesterday
// PETTY CASH: amount that is added today
// TOTAL: Total of both

interface UpdatePettyCashModalProps {
  pettyCash: PettyCash | null;
  selectedBranch: { branch_id: string };
}

export const UpdatePettyCashModal: React.FC<UpdatePettyCashModalProps> = ({
  pettyCash,
  selectedBranch,
}) => {
  const router = useRouter();
  const { transaction_date } = useParams();
  const [open, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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
    if (pettyCash) {
      pettyCashDate = formatDate(new Date(pettyCash.created_at), "yyyy-MM-dd");
      pettyCashId =
        pettyCashDate === transaction_date ? pettyCash.petty_cash_id : "CREATE";
    }
    const res = await updatePettyCash(pettyCashId, formData);

    if (res) {
      setIsLoading(false);
      if (!res.ok) {
        toast.error("error");
      } else {
        toast.success("Successfully updated petty cash!");
        setOpenDialog(false);
        router.refresh();
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Update Petty Cash</Button>

      <Dialog open={open} onOpenChange={() => setOpenDialog(!open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Update Petty Cash (Today&apos;s Petty Cash)
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="amount" className="w-40">
                Balance
              </Label>
              <div className="w-full">
                <InputNumber
                  name="amount"
                  defaultValue={pettyCash ? pettyCash.amount : 0}
                  min={0}
                  decimalScale={2}
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Label htmlFor="remarks" className="w-40">
                Remarks
              </Label>
              <Textarea name="remarks" required></Textarea>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
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
