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
import { updatePaymentMethod } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { getEnabledPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";

interface UpdatePaymentMethodModalProps {
  payment: {
    payment_id: string;
    amount_paid: number;
    payment_method?: PaymentMethod;
  };
}

export const UpdatePaymentMethodModal: React.FC<
  UpdatePaymentMethodModalProps
> = ({ payment }) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{
    [key: string]: string | undefined;
  }>({ label: undefined, value: undefined });
  const [paymentMethods, setPaymentMethods] = useState<
    { payment_method_id: string; name: string }[]
  >([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getEnabledPaymentMethods();
      if (!res.ok) return;
      setPaymentMethods(res.value);
      const defaultPaymentMethod = res.value.find(
        (item) =>
          item.payment_method_id === payment?.payment_method?.payment_method_id
      );

      if (defaultPaymentMethod) {
        setSelectedPaymentMethod({
          label: defaultPaymentMethod?.name,
          value: defaultPaymentMethod?.payment_method_id,
        });
      }
    };
    fetchInitialData();
  }, [payment?.payment_method?.payment_method_id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    if (!payment) return;

    const formData = new FormData(event.currentTarget);
    formData.append("payment_method", selectedPaymentMethod.value as string);

    const res = await updatePaymentMethod(payment.payment_id, formData);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully Updated Payment!");
        router.refresh();
        setOpen(false);
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Update Payment</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Update Payment Method</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label>Current Payment Method:</Label>
              <div className="rounded-md border px-3 py-2 text-sm">
                {payment.payment_method?.name ?? "N/A"}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Amount Paid:</Label>
              <InputNumber
                id="amount_paid"
                name="amount_paid"
                disabled
                hasStepper={false}
                value={payment.amount_paid}
              />
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-2">
              <Label>Payment Method:</Label>

              <SelectWithSearch
                modal={true}
                side="bottom"
                defaultValue={
                  selectedPaymentMethod as { label: string; value: string }
                }
                placeholder="Choose Payment Method"
                setSelected={(selected) => {
                  setSelectedPaymentMethod(selected as Record<string, string>);
                }}
                options={paymentMethods.map((item) => ({
                  label: item.name,
                  value: item.payment_method_id,
                }))}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose className="cursor-pointer">Cancel</DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
