"use client";

import type { ReactNode } from "react";
import { AuctionsInventory } from "src/entities/models/Auction";

import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { cn } from "@/app/lib/utils";
import { InventoryHistoriesTable } from "./InventoryHistoriesTable";

interface AuctionInventoryDetailsViewProps {
  auctionInventory: AuctionsInventory;
  actions?: ReactNode;
}

const getAuctionInventoryStatusVariant = (
  status: AuctionsInventory["status"],
): "warning" | "destructive" | "success" =>
  status === "PARTIAL"
    ? "warning"
    : ["UNPAID", "CANCELLED"].includes(status)
      ? "destructive"
      : "success";

const getInventoryStatusVariant = (
  status: AuctionsInventory["inventory"]["status"],
): "destructive" | "success" =>
  status === "UNSOLD" ? "destructive" : "success";

export const AuctionInventoryDetailsView: React.FC<
  AuctionInventoryDetailsViewProps
> = ({ auctionInventory, actions }) => {
  return (
    <div className="flex flex-col gap-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex flex-wrap justify-between gap-2">
            <CardDescription>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={getAuctionInventoryStatusVariant(
                    auctionInventory.status,
                  )}
                >
                  {auctionInventory.status}
                </Badge>
                <Badge
                  variant={getInventoryStatusVariant(
                    auctionInventory.inventory.status,
                  )}
                >
                  {auctionInventory.inventory.status}
                </Badge>
              </div>
            </CardDescription>
            {actions ? <div>{actions}</div> : null}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 border-t px-6 pt-6 md:flex-row md:flex-wrap">
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
            ].map((detail) => (
              <div
                key={detail.label}
                className={cn(
                  "flex w-full flex-col items-center md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]",
                )}
              >
                <p className="text-muted-foreground">{detail.label}</p>
                <p className="text-card-foreground text-center">{detail.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <InventoryHistoriesTable histories={auctionInventory.histories} />
    </div>
  );
};
