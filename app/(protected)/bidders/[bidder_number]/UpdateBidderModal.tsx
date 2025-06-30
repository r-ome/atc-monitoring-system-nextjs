"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bidder, BIDDER_STATUS } from "src/entities/models/Bidder";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { updateBidder } from "@/app/(protected)/bidders/actions";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { DatePicker } from "@/app/components/ui/datepicker";

type UpdateBidderForm = {
  bidder_number?: string;
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  contact_number?: string | null;
  registration_fee?: number;
  service_charge?: number;
  status?: BIDDER_STATUS;
};

interface UpdateBidderModalProps {
  bidder: Bidder;
}

export const UpdateBidderModal: React.FC<UpdateBidderModalProps> = ({
  bidder,
}) => {
  const router = useRouter();
  const [open, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newBidder, setNewBidder] = useState<UpdateBidderForm>();
  const [birthdate, setBirthdate] = useState<Date | undefined>();
  const [errors, setErrors] = useState<Record<string, string[]>>();

  useEffect(() => {
    setNewBidder({
      bidder_number: bidder.bidder_number,
      first_name: bidder.first_name,
      middle_name: bidder.middle_name,
      last_name: bidder.last_name,
      contact_number: bidder.contact_number,
      registration_fee: bidder.registration_fee,
      service_charge: bidder.service_charge,
      status: bidder.status,
    });

    if (bidder.birthdate) {
      setBirthdate(new Date(bidder.birthdate));
    }
  }, [bidder]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.append("registered_at", "BIÑAN");
    formData.append("status", "ACTIVE");

    const res = await updateBidder(bidder.bidder_id, formData);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated Bidder!");
        if (res.value.bidder_number !== bidder.bidder_number) {
          router.push(`/bidders/${res.value.bidder_number}`);
        } else {
          router.refresh();
        }
        setOpenDialog(false);
      } else {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
        if (res.error.message === "Invalid Data!") {
          toast.error(res.error.message);
          setErrors(res.error.cause as Record<string, string[]>);
        }
      }
    }
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;
    setNewBidder((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Edit Bidder</Button>

      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Bidder</DialogTitle>
            <DialogDescription>Update Bidder Details here</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="bidder_number" className="w-40">
                Bidder Number
              </Label>
              <Input
                name="bidder_number"
                value={newBidder?.bidder_number}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="first_name" className="w-40">
                First Name
              </Label>
              <Input
                name="first_name"
                value={newBidder?.first_name}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="middle_name" className="w-40">
                Middle Name
              </Label>
              <Input
                name="middle_name"
                value={newBidder?.middle_name || ""}
                onChange={handleUpdateChange}
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="last_name" className="w-40">
                Last Name
              </Label>
              <Input
                name="last_name"
                value={newBidder?.last_name}
                onChange={handleUpdateChange}
                error={errors}
                required
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="contact_number" className="w-40">
                Contact Number
              </Label>
              <Input
                name="contact_number"
                value={newBidder?.contact_number || ""}
                onChange={handleUpdateChange}
                error={errors}
                required
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="registration_fee" className="w-40">
                Registration Fee
              </Label>
              <div className="w-full">
                <InputNumber
                  name="registration_fee"
                  value={newBidder?.registration_fee}
                  onChange={handleUpdateChange}
                  required
                  error={errors}
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Label htmlFor="service_charge" className="w-40">
                Service Charge
              </Label>
              <div className="w-full">
                <InputNumber
                  name="service_charge"
                  value={newBidder?.service_charge}
                  onChange={handleUpdateChange}
                  error={errors}
                  required
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Label className="w-40">Birth Date</Label>
              <DatePicker
                id="birthdate"
                name="birthdate"
                date={birthdate}
                onChange={setBirthdate}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
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
