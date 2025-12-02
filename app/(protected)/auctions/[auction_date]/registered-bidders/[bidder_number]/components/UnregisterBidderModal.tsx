"use client";

import { Loader2Icon } from "lucide-react";
import { SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { unregisterBidder } from "@/app/(protected)/auctions/actions";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";

interface UnregisterBidderModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
  bidder: {
    auction_bidder_id: string;
  };
}

export const UnregisterBidderModal: React.FC<UnregisterBidderModalProps> = ({
  open,
  onOpenChange,
  bidder,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const res = await unregisterBidder(bidder.auction_bidder_id);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully unregistered bidder!");
        onOpenChange(false);
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unregister Bidder from Auction</DialogTitle>
            <DialogDescription>
              Bidder should not have any items in the auction before removing
              from auction
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
