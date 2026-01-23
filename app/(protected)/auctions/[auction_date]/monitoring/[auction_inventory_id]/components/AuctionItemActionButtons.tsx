"use client";

import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { SetStateAction, useEffect } from "react";
import { useAuctionItemContext } from "../context/AuctionItemContext";
import { AuctionsInventory } from "src/entities/models/Auction";

interface AuctionItemActionButtonsProps {
  auctionInventory: AuctionsInventory;
  auctionBidderId: string;
  setOpenCancelDialog: React.Dispatch<SetStateAction<boolean>>;
  setOpenUpdateDialog: React.Dispatch<SetStateAction<boolean>>;
}

export const AuctionItemActionButtons: React.FC<
  AuctionItemActionButtonsProps
> = ({
  auctionInventory,
  auctionBidderId,
  setOpenCancelDialog,
  setOpenUpdateDialog,
}) => {
  const { setAuctionInventory, setAuctionBidderId } = useAuctionItemContext();

  useEffect(() => {
    setAuctionInventory(auctionInventory);
    setAuctionBidderId(auctionBidderId);
  }, [
    auctionInventory,
    auctionBidderId,
    setAuctionInventory,
    setAuctionBidderId,
  ]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>Options</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setOpenCancelDialog(true)}
          disabled={["CANCELLED"].includes(auctionInventory.status)}
        >
          Cancel Item
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setOpenUpdateDialog(true)}>
          Edit Item
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
