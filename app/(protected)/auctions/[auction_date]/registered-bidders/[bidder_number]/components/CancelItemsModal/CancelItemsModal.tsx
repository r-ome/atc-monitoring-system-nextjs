"use client";

import { SetStateAction, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { CancelItemsTable } from "./CancelItemsTable";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useBidderPullOutModalContext } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/context/BidderPullOutModalContext";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import {
  getRegisteredBidderByBidderNumber,
  cancelItems,
} from "@/app/(protected)/auctions/actions";

interface CancelItemsModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
}

export const CancelItemsModal: React.FC<CancelItemsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { auction_date }: { auction_date: string } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { selectedItems, registeredBidder } = useBidderPullOutModalContext();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const toBeCancelledItems = selectedItems.map((item) => ({
      auction_inventory_id: item.auction_inventory_id,
      inventory_id: item.inventory_id,
    }));
    if (!registeredBidder) return;

    formData.append("auction_bidder_id", registeredBidder.auction_bidder_id);
    formData.append("auction_inventories", JSON.stringify(toBeCancelledItems));

    const res = await cancelItems(formData);
    if (res) {
      setIsLoading(false);

      if (res.ok) {
        toast.success(`Successfully cancelled ${selectedItems.length} items!`);
        onOpenChange(false);
        await getRegisteredBidderByBidderNumber(
          registeredBidder.bidder.bidder_number,
          auction_date
        );
        router.refresh();
      }

      if (!res.ok) {
        toast.error(res.error.message, {
          description: res.error.cause as string,
        });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px]">
        <DialogHeader>
          <DialogTitle>Cancel Items</DialogTitle>
        </DialogHeader>
        <DialogDescription className="font-bold uppercase">
          You are about to cancel {selectedItems.length} items. Are you sure?
        </DialogDescription>

        <form onSubmit={handleSubmit} id="cancel-items-modal">
          <CancelItemsTable />

          <div className="mx-auto w-5/6 flex flex-col gap-2 mt-4">
            <Label>Reason:</Label>
            <Textarea
              name="reason"
              placeholder="Please add reason here"
              required
            />
          </div>
        </form>

        <DialogFooter className="flex sm:justify-center">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>

          <Button type="submit" form="cancel-items-modal" disabled={isLoading}>
            {isLoading && <Loader2Icon className="animate-spin" />}
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
