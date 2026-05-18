"use client";

import { useMemo, useState } from "react";
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

export const AppendInventoriesStep = ({
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

  const appendable = preview.appendable_unsold_items;
  const containerBarcode = preview.sheet_details.barcode;

  const boughtByInventoryId = useMemo(() => {
    const map = new Map<
      string,
      { price: number; qty: string; auction_id: string; bidder_number: string; auction_date: string }
    >();
    for (const b of state.draft.bought_items) {
      if (b.action !== "BOUGHT") continue;
      map.set(b.inventory_id, {
        price: b.price,
        qty: b.qty,
        auction_id: b.auction_id,
        bidder_number: b.bidder_number,
        auction_date: b.auction_date,
      });
    }
    return map;
  }, [state.draft.bought_items]);

  const order = state.draft.appended_inventory_ids;
  const orderIndex = useMemo(() => {
    const m = new Map<string, number>();
    order.forEach((id, i) => m.set(id, i));
    return m;
  }, [order]);

  const selectedItem = appendable.find((item) => item.inventory_id === selectedId) ?? null;

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
      return;
    }
    setSelectedId(id);
    const existing = boughtByInventoryId.get(id);
    if (existing) {
      setPrice(String(existing.price));
      setQty(existing.qty);
      setAuctionId(existing.auction_id);
    } else {
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

  const priceNum = Number(price);
  const canConfirmItem =
    selectedItem !== null &&
    Number.isFinite(priceNum) &&
    priceNum > 0 &&
    qty.trim().length > 0 &&
    auctionId.length > 0 &&
    !loading;

  const handleConfirmItem = async () => {
    if (!canConfirmItem || !selectedItem) return;
    const bidderForAuction =
      preview.available_bidders.find(
        (b) =>
          b.auction_id === auctionId && b.bidder_number === ATC_DEFAULT_BIDDER_NUMBER,
      ) ?? preview.available_bidders.find((b) => b.auction_id === auctionId);
    if (!bidderForAuction) {
      toast.error("No bidder context available for this auction.");
      return;
    }
    setLoading("Staging append...");
    try {
      const nextAppendedIds = order.includes(selectedItem.inventory_id)
        ? order
        : [...order, selectedItem.inventory_id];
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
        appended_inventory_ids: nextAppendedIds,
      });
      toast.success(`${selectedItem.barcode} staged for append.`);
      clearSelection();
      await refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleRemove = async (inventoryId: string) => {
    setLoading("Removing append...");
    try {
      await saveDraft({
        ...state.draft,
        bought_items: state.draft.bought_items.filter(
          (b) => b.inventory_id !== inventoryId,
        ),
        appended_inventory_ids: order.filter((id) => id !== inventoryId),
      });
      if (selectedId === inventoryId) clearSelection();
      await refresh();
    } finally {
      setLoading(null);
    }
  };

  const allStaged =
    appendable.length > 0 &&
    appendable.every((item) => orderIndex.has(item.inventory_id));

  const baseSuffix = preview.next_append_suffix;
  const previewBarcodeFor = (inventoryId: string) => {
    const idx = orderIndex.get(inventoryId);
    if (idx === undefined) return null;
    return `${containerBarcode}-${baseSuffix + idx}`;
  };

  return (
    <StepShell
      step="append-inventories"
      visibleSteps={visibleSteps}
      onBack={goBack}
      onJumpTo={goTo}
      jumpDisabled={jumpDisabled}
      onNext={goNext}
      nextLabel="Save & Continue"
      nextDisabled={!allStaged}
      loading={loading}
      description={`Two-part UNSOLD inventories will be appended onto the container with the next available three-part barcodes (starting at ${containerBarcode}-${baseSuffix}). Click each item, set its bought-item price/qty/auction, then continue. The barcode rename only applies to the generated report — the underlying inventory's stored barcode does not change.`}
    >
      <div className="grid grid-cols-2 gap-4 min-w-0">
        {/* Left: appendable list */}
        <div className="min-w-0 flex flex-col gap-2">
          <p className="text-sm font-medium">
            Two-part UNSOLD{" "}
            <span className="text-muted-foreground font-normal">
              ({appendable.length})
            </span>
          </p>
          <div className="border rounded overflow-auto max-h-[420px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Barcode</TableHead>
                  <TableHead>Ctrl</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="whitespace-nowrap">New barcode</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appendable.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No two-part UNSOLD inventories.
                    </TableCell>
                  </TableRow>
                ) : (
                  appendable.map((item) => {
                    const selected = item.inventory_id === selectedId;
                    const staged = orderIndex.has(item.inventory_id);
                    const newBarcode = previewBarcodeFor(item.inventory_id);
                    return (
                      <TableRow
                        key={item.inventory_id}
                        onClick={() => selectItem(item.inventory_id)}
                        className={
                          selected
                            ? "bg-primary/10 cursor-pointer"
                            : staged
                              ? "bg-green-50 dark:bg-green-950/20 cursor-pointer hover:bg-muted/50"
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
                        <TableCell className="font-mono text-xs whitespace-nowrap">
                          {newBarcode ? (
                            <span className="text-green-700 dark:text-green-400 font-medium">
                              {newBarcode}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {staged ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemove(item.inventory_id);
                              }}
                              disabled={Boolean(loading)}
                            >
                              Remove
                            </Button>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {!allStaged && appendable.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              All items must be staged before you can continue.
            </p>
          ) : null}
        </div>

        {/* Right: bought-item form for selected item */}
        <div className="min-w-0 flex flex-col gap-3">
          {selectedItem ? (
            <>
              <div className="rounded-lg border bg-muted/40 p-3 flex flex-col gap-1 text-sm">
                <p className="font-mono font-medium">{selectedItem.barcode}</p>
                <p className="text-muted-foreground text-xs">
                  Ctrl: {selectedItem.control}
                </p>
                <p className="text-xs mt-0.5">{selectedItem.description}</p>
                {previewBarcodeFor(selectedItem.inventory_id) ? (
                  <p className="text-xs mt-1">
                    New barcode:{" "}
                    <span className="font-mono font-medium text-green-700 dark:text-green-400">
                      {previewBarcodeFor(selectedItem.inventory_id)}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs mt-1 text-muted-foreground">
                    Next available:{" "}
                    <span className="font-mono">
                      {containerBarcode}-{baseSuffix + order.length}
                    </span>
                  </p>
                )}
              </div>

              <div className="rounded-lg border p-3 flex flex-col gap-3">
                <p className="text-sm font-medium">Bought Item</p>
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
                  <Select value={auctionId} onValueChange={setAuctionId}>
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
                    onClick={handleConfirmItem}
                    disabled={!canConfirmItem}
                  >
                    Confirm
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-6">
              Select a two-part UNSOLD item on the left to set its bought-item
              price.
            </p>
          )}
        </div>
      </div>
    </StepShell>
  );
};
