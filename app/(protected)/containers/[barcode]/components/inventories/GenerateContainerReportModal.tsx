"use client";

import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { generateInventoryReport } from "@/app/lib/reports";
import type {
  InternalInventoryReportRow,
} from "@/app/lib/reports/generateInventoryReport";
import type { InventoryRowType } from "./ContainerInventoriesTable";

interface GenerateContainerReportModalProps {
  inventories: InventoryRowType[];
  container: {
    supplier: { name: string };
    barcode: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getFilename = (
  container: GenerateContainerReportModalProps["container"],
) =>
  `${container.supplier.name.toUpperCase()} ${container.barcode.toUpperCase()} INVENTORY REPORT`;

const buildReportRows = (
  inventories: InventoryRowType[],
): {
  paid: InternalInventoryReportRow[];
  unpaid: InternalInventoryReportRow[];
} => {
  const rows = inventories.flatMap((item): InternalInventoryReportRow[] => {
    const auctionInventory = item.auctions_inventory;
    if (!auctionInventory) return [];

    return [
      {
        barcode: item.barcode,
        control: item.control,
        description: auctionInventory.description,
        bidder_number: auctionInventory.bidder.bidder_number,
        qty: auctionInventory.qty,
        price: auctionInventory.price,
        auction_date: auctionInventory.auction_date || item.auction_date || "",
        status: auctionInventory.status,
        reason: auctionInventory.reason,
      },
    ];
  });

  const sortRows = (
    a: InternalInventoryReportRow,
    b: InternalInventoryReportRow,
  ) => {
    const dateCompare = a.auction_date.localeCompare(b.auction_date);
    if (dateCompare !== 0) return dateCompare;
    return a.control.localeCompare(b.control);
  };

  return {
    paid: rows
      .filter((item) => item.status === "PAID")
      .sort(sortRows),
    unpaid: rows
      .filter((item) => item.status !== "PAID")
      .sort(sortRows),
  };
};

export const GenerateContainerReportModal = ({
  inventories,
  container,
  open,
  onOpenChange,
}: GenerateContainerReportModalProps) => {
  const { paid, unpaid } = buildReportRows(inventories);
  const hasAuctionRows = paid.length + unpaid.length > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    generateInventoryReport({
      paid,
      unpaid,
      filename: getFilename(container),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Generate Inventory Report</DialogTitle>
            <DialogDescription>
              Creates an internal workbook with PAID and UNPAID sheets for this
              container.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid rows</span>
              <span className="font-medium">{paid.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unpaid rows</span>
              <span className="font-medium">{unpaid.length}</span>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!hasAuctionRows}>
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
