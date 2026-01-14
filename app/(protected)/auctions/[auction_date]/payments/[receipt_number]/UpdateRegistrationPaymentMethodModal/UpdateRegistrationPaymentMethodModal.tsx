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
import { updateRegistrationPayment } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { getPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";

interface UpdateRegistrationPaymentMethodModalProps {
  receipt: {
    receipt_id: string;
    bidder: {
      registration_fee: number;
      service_charge: number;
    };
    payments: {
      payment_id: string;
      payment_method: { payment_method_id: string; name: string };
    }[];
  };
  payment: {
    payment_id: string;
    payment_method?: PaymentMethod;
  };
}

export const UpdateRegistrationPaymentMethodModal: React.FC<
  UpdateRegistrationPaymentMethodModalProps
> = ({ receipt, payment }) => {
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
      const res = await getPaymentMethods();
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
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    if (!receipt || !payment) return;

    const formData = new FormData(event.currentTarget);
    formData.append("payment_method", selectedPaymentMethod.value as string);

    const res = await updateRegistrationPayment(payment.payment_id, formData);
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
            <DialogTitle>Update Registration Details</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <Label>Service Charge:</Label>
              <InputNumber
                id="service_charge"
                name="service_charge"
                disabled
                value={receipt.bidder.service_charge as number}
                suffix="%"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Registration Fee:</Label>

              <InputNumber
                id="registration_fee"
                name="registration_fee"
                disabled
                value={receipt.bidder.registration_fee as number}
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
