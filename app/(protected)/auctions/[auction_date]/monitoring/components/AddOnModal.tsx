"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  insertAuctionInventory,
  uploadManifest,
} from "@/app/(protected)/auctions/actions";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { SelectWithSearch } from "@/app/components/ui/SelectWithSearch";
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
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { RegisteredBidder } from "src/entities/models/Bidder";

interface AddOnModalProps {
  auction_id: string;
  registered_bidders: RegisteredBidder[];
}

export const AddOnModal: React.FC<AddOnModalProps> = ({
  auction_id,
  registered_bidders,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [selectedBidder, setSelectedBidder] = useState<{
    [key: string]: string;
  }>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    if (!selectedBidder) return;

    const formData = new FormData(event.currentTarget);
    formData.append("BIDDER", selectedBidder.value);
    formData.append("MANIFEST", "ADD ON");
    const res = await insertAuctionInventory(auction_id, formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully uploaded manifest!", {
          description:
            res.value +
            ". Please check the Manifest Page for more information.",
        });
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
          <Button>Add On</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add On</DialogTitle>
            <DialogDescription>Add On Form</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="BARCODE">Barcode: </Label>
              <Input
                type="text"
                id="BARCODE"
                name="BARCODE"
                error={errors}
                required
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="CONTROL">Control: </Label>
              <Input type="text" id="CONTROL" name="CONTROL" />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="DESCRIPTION">Description: </Label>
              <Input
                type="text"
                id="DESCRIPTION"
                name="DESCRIPTION"
                error={errors}
                required
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="PRICE">Price: </Label>
              <InputNumber
                id="PRICE"
                name="PRICE"
                error={errors}
                min={0}
                required
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="QTY">Qty: </Label>
              <Input type="text" id="QTY" name="QTY" error={errors} required />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="bidder">Bidder: </Label>
              <SelectWithSearch
                modal={true}
                side="bottom"
                placeholder="Select Bidder"
                setSelected={(selected) =>
                  setSelectedBidder(selected as Record<string, string>)
                }
                options={registered_bidders.map(({ bidder }) => ({
                  label: `${bidder.full_name} (${bidder.bidder_number})`,
                  value: bidder.bidder_number,
                }))}
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="MANIFEST">Manifest: </Label>
              <Input
                type="text"
                id="MANIFEST"
                name="MANIFEST"
                value="ADD ON"
                disabled
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
