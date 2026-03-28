"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
} from "@/app/components/ui/dialog";
import { SelectWithSearch } from "@/app/components/ui/SelectWithSearch";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { getEnabledPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";
import { addStorageFee } from "@/app/(protected)/auctions/[auction_date]/payments/actions";

interface AddStorageFeeModalProps {
  receipt_id: string;
}

export const AddStorageFeeModal: React.FC<AddStorageFeeModalProps> = ({
  receipt_id,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{
    label?: string;
    value?: string;
  }>({});
  const [paymentMethods, setPaymentMethods] = useState<
    { payment_method_id: string; name: string }[]
  >([]);

  useEffect(() => {
    const fetchMethods = async () => {
      const res = await getEnabledPaymentMethods();
      if (!res.ok) return;
      setPaymentMethods(res.value);
    };
    fetchMethods();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedPaymentMethod.value || amount <= 0) return;

    setIsLoading(true);
    const res = await addStorageFee({
      parent_receipt_id: receipt_id,
      amount,
      payment_method_id: selectedPaymentMethod.value,
    });

    setIsLoading(false);
    if (res.ok) {
      toast.success("Storage fee added successfully!");
      router.refresh();
      setOpen(false);
      setAmount(0);
      setSelectedPaymentMethod({});
    } else {
      const description =
        typeof res.error?.cause === "string" ? res.error.cause : undefined;
      toast.error(res.error.message, { description });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Storage Fee</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Add Storage Fee</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Amount</Label>
            <InputNumber
              id="amount"
              name="amount"
              value={amount}
              onValueChange={(val) => setAmount(val ?? 0)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Payment Method</Label>
            <SelectWithSearch
              modal={true}
              side="bottom"
              defaultValue={
                selectedPaymentMethod as { label: string; value: string }
              }
              placeholder="Choose Payment Method"
              setSelected={(selected) =>
                setSelectedPaymentMethod(selected as Record<string, string>)
              }
              options={paymentMethods.map((item) => ({
                label: item.name,
                value: item.payment_method_id,
              }))}
            />
          </div>

          <DialogFooter>
            <DialogClose className="cursor-pointer">Cancel</DialogClose>
            <Button
              type="submit"
              disabled={isLoading || amount <= 0 || !selectedPaymentMethod.value}
            >
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
