"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { StepShell } from "../shared/StepShell";
import { StepProps } from "../shared/types";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import type { FinalReportInventoryRow } from "src/entities/models/FinalReport";

export const BoughtItemsStep = ({
  preview,
  visibleSteps,
  goBack,
  goNext,
  goTo,
  jumpDisabled,
  loading,
  setLoading,
  refresh,
  state,
  saveDraft,
}: StepProps) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [auctionId, setAuctionId] = useState("");

  if (!preview) return null;

  // Eligible UNSOLD items — exclude CANCELLED, REFUNDED, and already-VOID
  const unsoldItems: FinalReportInventoryRow[] = preview.unsold_items.filter(
    (item) => {
      const s = item.auctions_inventory?.status;
      return s !== "CANCELLED" && s !== "REFUNDED";
    },
  );

  const selectedItem =
    unsoldItems.find((item) => item.inventory_id === selectedId) ?? null;

  // Unique auctions from available_bidders
  const availableAuctions = preview.available_bidders.reduce<
    { auction_id: string; auction_date: string }[]
  >((acc, b) => {
    if (!acc.some((a) => a.auction_id === b.auction_id)) {
      acc.push({ auction_id: b.auction_id, auction_date: b.auction_date });
    }
    return acc;
  }, []);

  const selectItem = (id: string) => {
    if (selectedId === id) {
      setSelectedId(null);
      setPrice("");
      setQty("1");
      setAuctionId("");
    } else {
      setSelectedId(id);
      setPrice("");
      setQty("1");
      setAuctionId(availableAuctions[0]?.auction_id ?? "");
    }
  };

  const clearSelection = () => {
    setSelectedId(null);
    setPrice("");
    setQty("1");
    setAuctionId("");
  };

  const handleVoid = async () => {
    if (!selectedItem) return;
    setLoading("Staging void...");
    try {
      await saveDraft({
        ...state.draft,
        bought_items: [
          ...state.draft.bought_items.filter(
            (b) => b.inventory_id !== selectedItem.inventory_id,
          ),
          { action: "VOID", inventory_id: selectedItem.inventory_id },
        ],
      });
      toast.success(`${selectedItem.barcode} staged as VOID.`);
      clearSelection();
      await refresh();
    } finally {
      setLoading(null);
    }
  };

  const priceNum = Number(price);
  const canConfirmBought =
    selectedItem !== null &&
    Number.isFinite(priceNum) &&
    priceNum > 0 &&
    qty.trim().length > 0 &&
    auctionId.length > 0 &&
    !loading;

  const handleConfirmBought = async () => {
    if (!canConfirmBought || !selectedItem) return;
    // Find a representative ATC bidder for the chosen auction from available_bidders.
    // If ATC bidder isn't in available_bidders for this auction, we fall back to the first bidder of that auction.
    const bidderForAuction =
      preview.available_bidders.find(
        (b) =>
          b.auction_id === auctionId && b.bidder_number === ATC_DEFAULT_BIDDER_NUMBER,
      ) ?? preview.available_bidders.find((b) => b.auction_id === auctionId);
    if (!bidderForAuction) {
      toast.error("No bidder context available for this auction.");
      return;
    }
    setLoading("Staging bought item...");
    try {
      await saveDraft({
        ...state.draft,
        bought_items: [
          ...state.draft.bought_items.filter(
            (b) => b.inventory_id !== selectedItem.inventory_id,
          ),
          {
            action: "BOUGHT",
            inventory_id: selectedItem.inventory_id,
            auction_id: auctionId,
            auction_bidder_id: bidderForAuction.auction_bidder_id,
            auction_date: bidderForAuction.auction_date,
            bidder_number: bidderForAuction.bidder_number,
            price: priceNum,
            qty: qty.trim(),
          },
        ],
      });
      toast.success(`${selectedItem.barcode} staged as Bought Item.`);
      clearSelection();
      await refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <StepShell
      step="bought-items"
      visibleSteps={visibleSteps}
      onBack={goBack}
      onJumpTo={goTo}
      jumpDisabled={jumpDisabled}
      onNext={goNext}
      nextLabel="Save & Continue"
      loading={loading}
      description="Resolve remaining UNSOLD items. Select an item on the left, then either void it (hidden from report, kept in system) or record it as a Bought Item with a price, qty, and auction."
    >
      <div className="grid grid-cols-2 gap-4 min-w-0">
        {/* Left: UNSOLD list */}
        <div className="min-w-0 flex flex-col gap-2">
          <p className="text-sm font-medium">
            UNSOLD{" "}
            <span className="text-muted-foreground font-normal">
              ({unsoldItems.length})
            </span>
          </p>
          <div className="border rounded overflow-auto max-h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Barcode</TableHead>
                  <TableHead>Ctrl</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {unsoldItems.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-sm text-muted-foreground"
                    >
                      No UNSOLD items remaining.
                    </TableCell>
                  </TableRow>
                ) : (
                  unsoldItems.map((item) => {
                    const selected = item.inventory_id === selectedId;
                    return (
                      <TableRow
                        key={item.inventory_id}
                        onClick={() => selectItem(item.inventory_id)}
                        className={
                          selected
                            ? "bg-primary/10 cursor-pointer"
                            : "cursor-pointer hover:bg-muted/50"
                        }
                      >
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {item.barcode}
                        </TableCell>
                        <TableCell className="text-xs">{item.control}</TableCell>
                        <TableCell
                          className="text-xs max-w-[120px] truncate"
                          title={item.description}
                        >
                          {item.description}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Right: item details + action form */}
        <div className="min-w-0 flex flex-col gap-3">
          {selectedItem ? (
            <>
              {/* Item details */}
              <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-1 text-sm">
                <p className="font-medium">{selectedItem.barcode}</p>
                <p className="text-muted-foreground text-xs">
                  Ctrl: {selectedItem.control}
                </p>
                <p className="text-xs mt-0.5">{selectedItem.description}</p>
              </div>

              {/* VOID action */}
              <div className="rounded-lg border p-3 flex flex-col gap-2">
                <p className="text-sm font-medium">Void</p>
                <p className="text-xs text-muted-foreground">
                  Item will not appear in the final report but remains in the
                  system.
                </p>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleVoid}
                    disabled={Boolean(loading)}
                  >
                    Void Item
                  </Button>
                </div>
              </div>

              {/* Bought Item action */}
              <div className="rounded-lg border p-3 flex flex-col gap-3">
                <p className="text-sm font-medium">Mark as Bought Item</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-8 text-sm"
                      placeholder="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      className="h-8 text-sm"
                      placeholder="1"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs">Auction</Label>
                  <Select
                    value={auctionId}
                    onValueChange={setAuctionId}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select auction..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAuctions.map((a) => (
                        <SelectItem key={a.auction_id} value={a.auction_id}>
                          {a.auction_date}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={clearSelection}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirmBought}
                    disabled={!canConfirmBought}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-6">
              Select an item on the left to void it or record it as a Bought
              Item.
            </p>
          )}
        </div>
      </div>
    </StepShell>
  );
};
