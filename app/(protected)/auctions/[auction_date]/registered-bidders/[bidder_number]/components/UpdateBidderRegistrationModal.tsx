"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBidderRegistration } from "@/app/(protected)/auctions/actions";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";
import { InputNumber } from "@/app/components/ui/InputNumber";

interface UpdateBidderRegistrationProps {
  bidder: {
    auction_bidder_id: string;
    registration_fee: number;
    service_charge: number;
  };
}

export const UpdateBidderRegistrationModal: React.FC<
  UpdateBidderRegistrationProps
> = ({ bidder }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await updateBidderRegistration(
      bidder.auction_bidder_id,
      formData
    );

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully uploaded bidder registration!");
        setOpen(false);
        router.refresh();
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Update Bidder Registration</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Bidder Registration</DialogTitle>
            <DialogDescription>
              Update Service Service Charge and Registration Fee
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label>Service Charge:</Label>
              <InputNumber
                id="service_charge"
                name="service_charge"
                defaultValue={12}
                value={bidder?.service_charge as number}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Registration Fee:</Label>

              <InputNumber
                id="registration_fee"
                name="registration_fee"
                defaultValue={3000}
                value={bidder?.registration_fee as number}
              />
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
