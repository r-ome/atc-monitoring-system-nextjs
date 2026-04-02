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
import { DeductionItem } from "@/app/lib/reports/generateReport";
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
  const [excludeBidder740, setExcludeBidder740] = useState<boolean>(false);
  const [deductThirtyK, setDeductThirtyK] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    let filename = `${container.supplier.name.toUpperCase()} ${container.barcode.toUpperCase()}`;
    if (filename.length > 30) {
      filename = filename.replace("CO.,LTD", "");
    }
    generateReport(
      {
        monitoring: adjusted_monitoring,
        inventories: inventories,
        sheetDetails: container,
        deductions: deductThirtyK ? deduction_items : undefined,
      },
      [
        "monitoring",
        "final_computation",
        "unsold",
        "encode",
        "bill",
        ...(deductThirtyK ? (["deductions"] as const) : []),
      ],
      filename,
    );
  };

  const auction_inventories = inventories.filter(
    (item) => item.auctions_inventory,
  );

  const auction_dates = auction_inventories.reduce<Record<string, number>>(
    (acc, item: InventoryRowType) => {
      const date = item?.auction_date;
      if (!date) return acc;
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const for_monitoring_report = inventories
    .filter((item) => {
      if (!item.auctions_inventory) return false;
      const auction_status = item.auctions_inventory.status;
      return !["CANCELLED", "REFUND"].includes(auction_status);
    })
    .filter((item) => selectedDates.includes(item?.auction_date || ""))
    .filter((item) =>
      excludeBidder740
        ? item.auctions_inventory?.bidder.bidder_number !== "0740"
        : true,
    )
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

  const isEligibleForDeduction = (desc: string) => {
    const upper = desc.toUpperCase();
    if (
      upper.includes("BRANDED") ||
      upper.includes("B. BAG") ||
      upper.includes("B.BAG") ||
      upper.includes("IN BOX") ||
      upper.includes("INBOX") ||
      upper.includes("METAL") ||
      upper.includes("SIZZLING") ||
      upper.includes("FRAME") ||
      /\bDI\b/.test(upper)
    )
      return false;
    const EXCLUDED_KEYWORDS = [
      "TABLE",
      "CAB",
      "CABINET",
      "DRAWER",
      "PARTITION",
      "DISPLAYER",
      "SHELF",
      "SHELVES",
      "RACK",
      "CHAIR",
      "SOFA",
      "DESK",
      "COUNTER",
      "WARDROBE",
      "CLOSET",
      "BED",
      "ACCESSORIES",
      "ACC",
      "KWL",
      "KW2",
    ];
    if (EXCLUDED_KEYWORDS.some((k) => new RegExp(`\\b${k}\\b`).test(upper)))
      return false;
    return ["KW", "GW", "ASSORTED", "ASSTD", "BAG", "LUGGAGE", "SHOES"].some(
      (k) => upper.includes(k),
    );
  };

  const bidder740_monitoring =
    deductThirtyK && excludeBidder740
      ? inventories
          .filter((item) => {
            if (!item.auctions_inventory) return false;
            return !["CANCELLED", "REFUND"].includes(
              item.auctions_inventory.status,
            );
          })
          .filter((item) => selectedDates.includes(item?.auction_date || ""))
          .filter(
            (item) => item.auctions_inventory?.bidder.bidder_number === "0740",
          )
          .map((item) => ({
            control: item.control,
            description:
              item.auctions_inventory?.description ?? item.description,
            bidder_number: "0740",
            price: item.auctions_inventory?.price ?? 0,
          }))
      : [];

  const { adjusted_monitoring, deduction_items } = (() => {
    if (!deductThirtyK) {
      return {
        adjusted_monitoring: for_monitoring_report,
        deduction_items: [] as DeductionItem[],
      };
    }

    const bidder740Sum = bidder740_monitoring.reduce(
      (acc, i) => acc + i.price,
      0,
    );
    let remaining = Math.max(0, 30000 - bidder740Sum);

    const deductions: DeductionItem[] = bidder740_monitoring.map((i) => ({
      control: i.control,
      description: i.description,
      bidder_number: i.bidder_number,
      original_price: i.price,
      deducted_amount: i.price,
    }));

    const adjusted = for_monitoring_report.map((item) => {
      if (remaining <= 0 || !isEligibleForDeduction(item.description))
        return item;
      const reduction = [500, 200, 100].find(
        (step) => step <= remaining && item.price - step >= 100,
      );
      if (!reduction) return item;
      remaining -= reduction;
      deductions.push({
        control: item.control,
        description: item.description,
        bidder_number: item.bidder_number,
        original_price: item.price,
        deducted_amount: reduction,
      });
      return { ...item, price: item.price - reduction };
    });

    return { adjusted_monitoring: adjusted, deduction_items: deductions };
  })();

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
                        prev.includes(item) ? prev : [...prev, item],
                      );
                    } else if (checked === false) {
                      setSelectedDates((prev) =>
                        prev.filter((selectedDate) => selectedDate !== item),
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

          <div className="border-t pt-2 space-y-1">
            <p className="text-sm font-medium">Options</p>
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={excludeBidder740}
                onCheckedChange={(checked) =>
                  setExcludeBidder740(checked === true)
                }
              />
              <span>Remove Bidder 740</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={deductThirtyK}
                onCheckedChange={(checked) =>
                  setDeductThirtyK(checked === true)
                }
              />
              <span>Less 30,000</span>
            </label>
          </div>
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
