"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Checkbox } from "@/app/components/ui/checkbox";
import { generateReport } from "@/app/lib/reports";
import { InventoryRowType } from "./ContainerInventoriesTable";
import { DialogDescription } from "@radix-ui/react-dialog";

interface GenerateContainerReportModalProps {
  inventories: InventoryRowType[];
  container: {
    supplier: { name: string };
    barcode: string;
  };
}

export const GenerateContainerReportModal = ({
  inventories,
  container,
}: GenerateContainerReportModalProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [selectedDates, setSelectedDates] = useState<string[]>([]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let filename = `${container.supplier.name.toUpperCase()} ${container.barcode.toUpperCase()}`;
    if (filename.length > 30) {
      filename = filename.replace("CO.,LTD", "");
    }
    generateReport(
      {
        monitoring: for_monitoring_report,
        sheetDetails: container,
      },
      ["monitoring", "final_computation", "unsold", "encode", "bill"],
      filename
    );
  };

  const auction_inventories = inventories.filter(
    (item) => item.auctions_inventory
  );

  const auction_dates = auction_inventories.reduce<Record<string, number>>(
    (acc, item: InventoryRowType) => {
      const date = item?.auction_date;
      if (!date) return acc;
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    },
    {}
  );

  const for_monitoring_report = inventories
    .filter((item) => item.status !== "VOID")
    .filter((item) => {
      if (!item.auctions_inventory) return false;
      const auction_status = item.auctions_inventory.status;
      return !["CANCELLED", "REFUND"].includes(auction_status);
    })
    .filter((item) => selectedDates.includes(item?.auction_date || ""))
    .map((item) => {
      const auction_inventory = item.auctions_inventory;
      return {
        barcode: item.barcode,
        control: item.control,
        description: auction_inventory
          ? auction_inventory.description
          : item.description,
        bidder_number: auction_inventory
          ? auction_inventory.bidder.bidder_number
          : "",
        qty: auction_inventory ? auction_inventory.qty : "",
        price: auction_inventory ? auction_inventory.price : 0,
        status: item.status,
      };
    })
    .sort((a, b) => a.control.localeCompare(b.control));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Generate Report</Button>
      </DialogTrigger>
      <DialogContent className="w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Generate Container Report</DialogTitle>
            <DialogDescription>Choose Auction Date</DialogDescription>
          </DialogHeader>

          {Object.keys(auction_dates).map((item) => (
            <div key={item}>
              <label className="flex items-center space-x-2 cursor-pointer">
                <Checkbox
                  checked={selectedDates.includes(item)}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      setSelectedDates((prev) =>
                        prev.includes(item) ? prev : [...prev, item]
                      );
                    } else if (checked === false) {
                      setSelectedDates((prev) =>
                        prev.filter((selectedDate) => selectedDate !== item)
                      );
                    }
                  }}
                />
                <span>
                  {item} ({auction_dates[item]} records)
                </span>
              </label>
            </div>
          ))}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant={"outline"} className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!selectedDates.length}>
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
