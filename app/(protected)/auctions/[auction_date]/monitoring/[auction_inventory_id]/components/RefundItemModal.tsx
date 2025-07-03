"use client";

import { Loader2Icon, OctagonAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Textarea } from "@/app/components/ui/textarea";
import { SetStateAction } from "react";
import { useAuctionItemContext } from "../context/AuctionItemContext";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { Label } from "@/app/components/ui/label";
import { refundAuctionsInventories } from "@/app/(protected)/auctions/[auction_date]/payments/actions";

interface RefundItemModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
}

type RefundType = "PARTIAL" | "FULL";

export const RefundItemModal: React.FC<RefundItemModalProps> = ({
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const { auctionInventory, auctionBidderId } = useAuctionItemContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refundType, setRefundType] = useState<RefundType>("PARTIAL");
  const [newAuctionInventory, setNewAuctionInventory] = useState<{
    price?: number;
  }>({});

  useEffect(() => {
    if (!auctionInventory) return;

    setNewAuctionInventory({ price: auctionInventory.price });
  }, [auctionInventory]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("auction_bidder_id", auctionBidderId);
    formData.append(
      "auction_inventories",
      JSON.stringify([
        {
          auction_inventory_id: auctionInventory?.auction_inventory_id,
          inventory_id: auctionInventory?.inventory_id,
          receipt: auctionInventory?.receipt,
          prev_price: auctionInventory?.price,
          new_price: newAuctionInventory.price,
        },
      ])
    );

    const res = await refundAuctionsInventories(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully refunded item!");
        router.refresh();
        onOpenChange(false);
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex mx-auto gap-2">
                <OctagonAlert className="h-7 w-7 text-destructive" />
                REFUND ITEM
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to refund this item. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            {["PARTIAL", "FULL"].map((item) => (
              <div
                key={item}
                onClick={() => setRefundType(item as RefundType)}
                className="border w-1/2 text-center py-6 hover:shadow-sm cursor-pointer"
              >
                {item}
              </div>
            ))}
          </div>
          {refundType === "PARTIAL" ? (
            <div className="flex gap-4">
              <Label htmlFor="new_price" className="w-2/6">
                NEW PRICE:{" "}
              </Label>
              <div className="w-full">
                <InputNumber
                  defaultValue={newAuctionInventory.price}
                  max={auctionInventory?.price || 0}
                  placeholder="New price for the item"
                  onChange={(e) =>
                    setNewAuctionInventory((prev) => ({
                      ...prev,
                      price: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          ) : null}
          <div>
            <Textarea
              placeholder="Please add reason why you would refund this item"
              name="reason"
              required
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => onOpenChange(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="submit">
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};
