"use client";

import { useState } from "react";
import { AuctionsInventory } from "src/entities/models/Auction";

import { CancelItemModal } from "./CancelItemModal";
import { AuctionItemProvider } from "../context/AuctionItemContext";
import { AuctionItemActionButtons } from "./AuctionItemActionButtons";
import { UpdateItemModal } from "./UpdateItemModal";
import { AuctionInventoryDetailsView } from "./AuctionInventoryDetailsView";

interface AuctionInventoryWrapperProps {
  auctionInventory: AuctionsInventory;
}

export const AuctionInventoryWrapper: React.FC<
  AuctionInventoryWrapperProps
> = ({ auctionInventory }) => {
  const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);

  return (
    <AuctionItemProvider>
      <div className="flex flex-col gap-4">
        <AuctionInventoryDetailsView
          auctionInventory={auctionInventory}
          actions={
            <AuctionItemActionButtons
              auctionInventory={auctionInventory}
              auctionBidderId={auctionInventory.auction_bidder_id}
              setOpenCancelDialog={setOpenCancelDialog}
              setOpenUpdateDialog={setOpenUpdateDialog}
            />
          }
        />
        <CancelItemModal
          open={openCancelDialog}
          onOpenChange={setOpenCancelDialog}
        />

        <UpdateItemModal
          open={openUpdateDialog}
          onOpenChange={setOpenUpdateDialog}
        />
      </div>
    </AuctionItemProvider>
  );
};
