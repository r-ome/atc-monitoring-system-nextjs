"use client";

import { useState } from "react";
import { AuctionsInventory } from "src/entities/models/Auction";

import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";
import { Badge } from "@/app/components/ui/badge";

import { CancelItemModal } from "./CancelItemModal";
import { AuctionItemProvider } from "../context/AuctionItemContext";
import { AuctionItemActionButtons } from "./AuctionItemActionButtons";
import { UpdateItemModal } from "./UpdateItemModal";
import { InventoryHistoriesTable } from "./InventoryHistoriesTable";

interface AuctionInventoryWrapperProps {
  auctionInventory: AuctionsInventory;
}

export const AuctionInventoryWrapper: React.FC<
  AuctionInventoryWrapperProps
> = ({ auctionInventory }) => {
  const [openCancelDialog, setOpenCancelDialog] = useState<boolean>(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState<boolean>(false);

  const AuctionInventoryDetails = () => (
    <div className="space-y-2 border-t px-6 pt-6 flex">
      {[
        {
          label: "Barcode",
          value: auctionInventory.inventory.barcode,
        },
        {
          label: "Control",
          value: auctionInventory.inventory.control,
        },
        {
          label: "Description",
          value: auctionInventory.description,
        },
        {
          label: "Price",
          value: `₱${auctionInventory.price.toLocaleString()}`,
        },
        {
          label: "Bidder",
          value: `${auctionInventory.bidder.bidder_number}`,
        },
        {
          label: "Manifest",
          value: auctionInventory.manifest_number,
        },
      ].map((detail, i) => (
        <div key={i} className={cn("flex flex-col items-center w-1/2")}>
          <p className="text-muted-foreground">{detail.label}</p>{" "}
          <p className="text-card-foreground text-center">{detail.value}</p>
        </div>
      ))}
    </div>
  );

  const StatusBadgeComponent = () => {
    const auctionInventoryStatusVariant =
      auctionInventory.status === "PARTIAL"
        ? "warning"
        : ["UNPAID", "CANCELLED"].includes(auctionInventory.status)
          ? "destructive"
          : "success";
    return (
      <>
        <Badge variant={auctionInventoryStatusVariant}>
          {auctionInventory.status}
        </Badge>
        <Badge
          variant={
            ["UNSOLD", "VOID"].includes(auctionInventory.inventory.status)
              ? "destructive"
              : "success"
          }
        >
          {auctionInventory.inventory.status}
        </Badge>
      </>
    );
  };

  return (
    <AuctionItemProvider>
      <div className="flex flex-col gap-4">
        <Card className="w-full">
          <CardHeader>
            <div className="flex justify-between">
              <CardDescription>
                <div className="flex gap-2">
                  <StatusBadgeComponent />

                  <AuctionItemActionButtons
                    auctionInventory={auctionInventory}
                    auctionBidderId={auctionInventory.auction_bidder_id}
                    setOpenCancelDialog={setOpenCancelDialog}
                    setOpenUpdateDialog={setOpenUpdateDialog}
                  />
                </div>
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <AuctionInventoryDetails />
          </CardContent>
        </Card>

        <InventoryHistoriesTable histories={auctionInventory.histories} />

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
