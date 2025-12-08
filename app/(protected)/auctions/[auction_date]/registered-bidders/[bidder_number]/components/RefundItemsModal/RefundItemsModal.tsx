"use client";

import { SetStateAction, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Loader2Icon, TriangleAlert } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { RefundItemsTable } from "./RefundItemsTable";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useBidderPullOutModalContext } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/context/BidderPullOutModalContext";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { getRegisteredBidderByBidderNumber } from "@/app/(protected)/auctions/actions";
import { refundAuctionsInventories } from "@/app/(protected)/auctions/[auction_date]/payments/actions";

interface RefundItemsModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
}

export const RefundItemsModal: React.FC<RefundItemsModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { auction_date }: { auction_date: string } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { selectedItems, registeredBidder } = useBidderPullOutModalContext();
  const [newSelectedItems, setNewSelectedItems] = useState<{
    [auction_inventory_id: string]: number;
  }>(
    selectedItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.auction_inventory_id] = item.price;
      return acc;
    }, {})
  );

  useEffect(() => {
    if (!selectedItems.length) return;

    setNewSelectedItems(
      selectedItems.reduce<Record<string, number>>((acc, item) => {
        acc[item.auction_inventory_id] = item.price;
        return acc;
      }, {})
    );
  }, [selectedItems]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const auctions_inventories = selectedItems.map((item) => ({
      auction_inventory_id: item.auction_inventory_id,
      inventory_id: item.inventory_id,
      prev_price: item.price,
      new_price:
        newSelectedItems?.[item.auction_inventory_id] >= item.price
          ? item.price
          : newSelectedItems?.[item.auction_inventory_id],
    }));
    if (!registeredBidder) return;

    formData.append("auction_bidder_id", registeredBidder.auction_bidder_id);
    formData.append(
      "auction_inventories",
      JSON.stringify(auctions_inventories)
    );
    const reason = formData.get("reason") as string;
    formData.set("reason", reason?.toUpperCase());

    const res = await refundAuctionsInventories(formData);

    if (res) {
      setIsLoading(false);

      if (res.ok) {
        toast.success(`Successfully refunded ${selectedItems.length} items!`);
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

  const handlePriceUpdate = (
    auction_inventory_id: string,
    newPrice: number
  ) => {
    setNewSelectedItems((prev) => ({
      ...prev,
      [auction_inventory_id]: newPrice,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[700px]">
        <DialogHeader>
          <DialogTitle>Refund Items</DialogTitle>
        </DialogHeader>
        <DialogDescription className="font-bold uppercase">
          <div className="flex flex-col gap-2">
            You are about to refund {selectedItems.length} items. Are you sure?
            <div className="flex gap-2 items-center">
              <TriangleAlert color="orange" />
              <div>
                If an item is declared to be FULL REFUND, DO NOT change the NEW
                PRICE
              </div>
            </div>
          </div>
        </DialogDescription>

        <form onSubmit={handleSubmit} id="cancel-items-modal">
          <RefundItemsTable handlePriceUpdate={handlePriceUpdate} />

          <div className="mx-auto flex flex-col gap-2 mt-4">
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
