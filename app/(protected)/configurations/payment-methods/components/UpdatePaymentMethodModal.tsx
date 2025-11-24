"use client";

import { SetStateAction, useState, useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { updatePaymentMethod } from "../actions";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";

type UpdatePaymentMethodForm = {
  name: string | null;
  state?: string;
};

interface UpdatePaymentMethodProps {
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
  selected: PaymentMethod;
}

export const UpdatePaymentMethodModal: React.FC<UpdatePaymentMethodProps> = ({
  open,
  setOpen,
  selected,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [newSelected, setNewSelected] =
    useState<UpdatePaymentMethodForm>(selected);

  useEffect(() => {
    setNewSelected({
      name: selected?.name,
      state: selected?.state,
    });
  }, [selected]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    if (!selected) return;

    const formData = new FormData(event.currentTarget);
    const res = await updatePaymentMethod(selected.payment_method_id, formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated payment method!");
        setOpen(false);
        router.refresh();
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
        if (res.error.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        }
      }
    }
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;
    setNewSelected((prev) => ({ ...prev, [name]: value }));
  };

  if (!selected) return null;

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Payment Method</DialogTitle>
            <DialogDescription>Update Payment Method details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <Label htmlFor="name" className="w-40">
                Name:
              </Label>
              <Input
                name="name"
                value={newSelected?.name || ""}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="control" className="w-30">
                State
              </Label>
              <div>
                <RadioGroup
                  name="state"
                  defaultValue={newSelected.state}
                  className="flex"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ENABLED" id="enabled" />
                    <Label htmlFor="enabled" className="cursor-pointer">
                      ENABLED
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <RadioGroupItem value="DISABLED" id="disabled" />
                    <Label htmlFor="disabled" className="cursor-pointer">
                      DISABLED
                    </Label>
                  </div>
                </RadioGroup>
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
    </div>
  );
};
