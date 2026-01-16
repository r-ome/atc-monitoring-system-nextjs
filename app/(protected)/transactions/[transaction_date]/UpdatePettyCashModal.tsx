"use client";

import { Loader2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, redirect } from "next/navigation";
import { useEffect, useState } from "react";
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
import { updatePettyCash } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { toast } from "sonner";
import { formatDate } from "@/app/lib/utils";
import { getBranches } from "../../branches/actions";
import { Branch } from "src/entities/models/Branch";
import { PettyCash } from "src/entities/models/Expense";

// NOTES
// BALANCE PETTY CASH: Balance from yesterday
// PETTY CASH: amount that is added today
// TOTAL: Total of both

export const UpdatePettyCashModal: React.FC<{
  pettyCash: PettyCash | null;
}> = ({ pettyCash }) => {
  const router = useRouter();
  const session = useSession();
  const { transaction_date } = useParams();
  const [open, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  if (session.data === null) redirect("/login");
  const user = session?.data?.user;

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getBranches();
      if (!res.ok) return;
      setBranches(res.value);
    };
    fetchInitialData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const currentTime = formatDate(new Date(), "HH:mm:ss");
    const formData = new FormData(event.currentTarget);
    formData.append("created_at", `${transaction_date}T${currentTime}`);
    const remarks = formData.get("remarks") as string;
    formData.set("remarks", remarks.toUpperCase());
    if (!["OWNER", "SUPER_ADMIN"].includes(user.role)) {
      formData.append("branch_id", user?.branch.branch_id);
    }

    const pettyCashId = pettyCash ? pettyCash.petty_cash_id : "CREATE";
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

      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Petty Cash (Today's Petty Cash)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="balance" className="w-40">
                Balance
              </Label>
              <div className="w-full">
                <InputNumber
                  name="balance"
                  defaultValue={pettyCash ? pettyCash.balance : 0}
                  min={0}
                  decimalScale={2}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Label htmlFor="remarks" className="w-40">
                Remarks
              </Label>
              <Textarea name="remarks" required></Textarea>
            </div>

            {user && ["SUPER_ADMIN", "OWNER"].includes(user.role) ? (
              <div className="flex gap-4">
                <Label htmlFor="branch_id" className="w-40">
                  Branch
                </Label>
                <Select
                  required
                  name="branch_id"
                  defaultValue="bd163cce-98e5-4513-b69e-875bd89c5f5c"
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select branch"></SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {branches.map((item) => (
                        <SelectItem key={item.branch_id} value={item.branch_id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            ) : null}

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
