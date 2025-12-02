"use client";

import { useState } from "react";
import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { UnregisterBidderModal } from "../components/UnregisterBidderModal";
import { UpdateBidderRegistrationModal } from "../components/UpdateBidderRegistrationModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

interface BidderRegistrationOptionsProps {
  bidder: {
    auction_bidder_id: string;
    registration_fee: number;
    service_charge: number;
    auction_inventories: { auction_inventory_id: string }[];
  };
}

export const BidderRegistrationOptions: React.FC<
  BidderRegistrationOptionsProps
> = ({ bidder }) => {
  const [
    openUpdateBidderRegistrationModal,
    setOpenUpdateBidderRegistrationModal,
  ] = useState<boolean>(false);
  const [openUnregisterBidderModal, setOpenUnregisterBidderModal] =
    useState<boolean>(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!!bidder.auction_inventories.length ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <DropdownMenuItem
                    onClick={() => setOpenUnregisterBidderModal(true)}
                    disabled={!!bidder.auction_inventories.length}
                  >
                    Unregister Bidder
                  </DropdownMenuItem>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">
                Bidder already have items in auction!
              </TooltipContent>
            </Tooltip>
          ) : (
            <DropdownMenuItem
              onClick={() => setOpenUnregisterBidderModal(true)}
            >
              Unregister Bidder
            </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setOpenUpdateBidderRegistrationModal(true)}
          >
            Update Bidder Registration
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UnregisterBidderModal
        open={openUnregisterBidderModal}
        onOpenChange={setOpenUnregisterBidderModal}
        bidder={bidder}
      />

      <UpdateBidderRegistrationModal
        open={openUpdateBidderRegistrationModal}
        onOpenChange={setOpenUpdateBidderRegistrationModal}
        bidder={bidder}
      />
    </>
  );
};
