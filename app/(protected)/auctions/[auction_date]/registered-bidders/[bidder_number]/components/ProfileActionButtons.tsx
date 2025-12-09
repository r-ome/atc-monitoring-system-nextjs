"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenuTrigger,
  DropdownMenu,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { RegisteredBidder } from "src/entities/models/Bidder";
import { PullOutModal } from "./PullOutModal/PullOutModal";
import { useBidderPullOutModalContext } from "../context/BidderPullOutModalContext";
import { CancelItemsModal } from "./CancelItemsModal/CancelItemsModal";
import { RefundItemsModal } from "./RefundItemsModal/RefundItemsModal";
import { ViewBillingModal } from "./ViewBillingModal";

interface ProfileActionButtonsProps {
  selectedItems: RegisteredBidder["auction_inventories"];
  registeredBidder: RegisteredBidder;
  selectLastPrintedReceipt: () => void;
}

export const ProfileActionButtons: React.FC<ProfileActionButtonsProps> = ({
  registeredBidder,
  selectedItems,
  selectLastPrintedReceipt,
}) => {
  const [openRefundModal, setOpenRefundModal] = useState<boolean>(false);
  const [openPullOutModal, setOpenPullOutModal] = useState<boolean>(false);
  const [openViewBillingModal, setOpenViewBillingModal] =
    useState<boolean>(false);
  const [openCancelItemsModal, setOpenCancelItemsModal] =
    useState<boolean>(false);
  const { setRegisteredBidder, setSelectedItems } =
    useBidderPullOutModalContext();

  useEffect(() => {
    setRegisteredBidder(registeredBidder);
    setSelectedItems(selectedItems);
  }, [selectedItems, registeredBidder, setRegisteredBidder, setSelectedItems]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>Options</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {localStorage.getItem(registeredBidder.auction_bidder_id) ? (
            <DropdownMenuItem onClick={() => selectLastPrintedReceipt()}>
              Select Last Printed Receipt
            </DropdownMenuItem>
          ) : null}

          <DropdownMenuItem
            onClick={() => setOpenPullOutModal(true)}
            disabled={
              selectedItems.some((item) =>
                ["PAID", "CANCELLED"].includes(item.status)
              ) || !selectedItems.length
            }
          >
            Pull Out
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenCancelItemsModal(true)}
            disabled={selectedItems.some((item) => item.status === "CANCELLED")}
          >
            Cancel Items
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenRefundModal(true)}
            disabled={selectedItems.some(
              (item) => !["PAID"].includes(item.status)
            )}
          >
            Refund Items
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpenViewBillingModal(true)}
            disabled={
              !selectedItems.filter((item) => item.status === "UNPAID").length
            }
          >
            View Receipt
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PullOutModal
        open={openPullOutModal}
        onOpenChange={setOpenPullOutModal}
      />

      <CancelItemsModal
        open={openCancelItemsModal}
        onOpenChange={setOpenCancelItemsModal}
      />

      <RefundItemsModal
        open={openRefundModal}
        onOpenChange={setOpenRefundModal}
      />

      <ViewBillingModal
        open={openViewBillingModal}
        onOpenChange={setOpenViewBillingModal}
      />
    </>
  );
};
