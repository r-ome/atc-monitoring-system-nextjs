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
import { cancelItems } from "@/app/(protected)/auctions/actions";
import { toast } from "sonner";
import { CancelRefundTagSelect } from "@/app/components/shared/CancelRefundTagSelect";

interface CancelItemModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
}

export const CancelItemModal: React.FC<CancelItemModalProps> = ({
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const { auctionInventory, auctionBidderId } = useAuctionItemContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reason, setReason] = useState<string>("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("auction_bidder_id", auctionBidderId);
    formData.append("auction_inventories", JSON.stringify([auctionInventory]));

    const res = await cancelItems(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully cancelled item!");
        router.refresh();
        onOpenChange(false);
      }

      if (!res.ok) {
        toast.error(res.error.message, {
          description: res.error.cause as string,
        });
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSubmit} className="space-y-2">
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex mx-auto gap-2">
                <OctagonAlert className="h-7 w-7 text-destructive" />
                CANCEL ITEM
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to cancel this item. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder="Please add reason why you would cancel this item"
              name="reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <CancelRefundTagSelect reason={reason} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button type="submit" disabled={isLoading}>
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
