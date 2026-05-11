"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Label } from "@/app/components/ui/label";
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
import type { FinalReportInventoryRow, FinalReportMonitoringRow } from "src/entities/models/FinalReport";

const ATC_BIDDER_NUMBER = "5013";

export const QtySplitStep = ({
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
  const [showAllSold, setShowAllSold] = useState(false);
  const [descFilter, setDescFilter] = useState("");
  const [selectedUnsoldIds, setSelectedUnsoldIds] = useState<Set<string>>(new Set());
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [splitPrices, setSplitPrices] = useState<Record<string, string>>({});
  const [splitQtys, setSplitQtys] = useState<Record<string, string>>({});
  // keyed by selectedSourceId — user override for the source's remaining qty
  const [sourceQtyOverrides, setSourceQtyOverrides] = useState<Record<string, string>>({});

  if (!preview) return null;

  // Left: UNSOLD items, excluding CANCELLED/REFUNDED predecessors
  const unsoldItems = useMemo(
    () =>
      preview.unsold_items.filter((item) => {
        const s = item.auctions_inventory?.status;
        return s !== "CANCELLED" && s !== "REFUNDED";
      }),
    [preview.unsold_items],
  );

  // Right: monitoring rows, excluding ATC's own bought items
  const soldItems = useMemo(
    () =>
      preview.report.monitoring.filter(
        (item) => item.bidder_number !== ATC_BIDDER_NUMBER,
      ),
    [preview.report.monitoring],
  );

  const filteredSoldItems = useMemo(() => {
    let rows = showAllSold ? soldItems : soldItems.filter((item) => Number(item.qty) > 1);
    const q = descFilter.trim().toUpperCase();
    if (q) rows = rows.filter((item) => item.description.toUpperCase().includes(q));
    return rows;
  }, [soldItems, showAllSold, descFilter]);

  const sourceItem = useMemo(
    () => soldItems.find((item) => item.auction_inventory_id === selectedSourceId) ?? null,
    [soldItems, selectedSourceId],
  );

  const selectedUnsoldItems = useMemo(
    () => unsoldItems.filter((item) => selectedUnsoldIds.has(item.inventory_id)),
    [unsoldItems, selectedUnsoldIds],
  );

  const defaultSplitPrice = useMemo(() => {
    if (!sourceItem) return 0;
    const qty = Number(sourceItem.qty);
    if (!qty) return sourceItem.price;
    const portion = sourceItem.price / qty;
    return Math.round(portion / 100) * 100;
  }, [sourceItem]);

  // Auto-compute source remaining qty = source.qty - sum(split qtys); overrideable per source.
  // Only applies arithmetic when source qty is a plain integer; non-numeric (e.g. "1 LOT") is left as-is.
  const computedSourceQty = useMemo(() => {
    if (!sourceItem) return "";
    const isNumeric = /^\d+$/.test(sourceItem.qty.trim());
    if (!isNumeric) return sourceItem.qty;
    const totalSplitQty = selectedUnsoldItems.reduce((sum, item) => {
      const q = Number(splitQtys[item.inventory_id] ?? "1");
      return sum + (Number.isFinite(q) ? q : 0);
    }, 0);
    return String(Math.max(0, Number(sourceItem.qty) - totalSplitQty));
  }, [sourceItem, selectedUnsoldItems, splitQtys]);

  const getSourceQty = () =>
    selectedSourceId !== null
      ? (sourceQtyOverrides[selectedSourceId] ?? computedSourceQty)
      : "";

  const getPriceForItem = (id: string) => {
    const raw = splitPrices[id];
    return raw !== undefined ? raw : String(defaultSplitPrice);
  };

  const getQtyForItem = (id: string) => splitQtys[id] ?? "1";

  const splitTotal = useMemo(
    () =>
      selectedUnsoldItems.reduce((sum, item) => {
        const p = Number(getPriceForItem(item.inventory_id));
        return sum + (Number.isFinite(p) && p > 0 ? p : 0);
      }, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedUnsoldItems, splitPrices, defaultSplitPrice],
  );

  const remaining = sourceItem ? sourceItem.price - splitTotal : 0;
  const isOverBudget = sourceItem ? splitTotal > sourceItem.price : false;
  const hasInvalidPrice = selectedUnsoldItems.some((item) => {
    const p = Number(getPriceForItem(item.inventory_id));
    return !Number.isFinite(p) || p <= 0;
  });
  const canConfirm =
    selectedUnsoldItems.length > 0 &&
    sourceItem !== null &&
    !isOverBudget &&
    !hasInvalidPrice &&
    !loading;

  const toggleUnsold = (id: string) => {
    setSelectedUnsoldIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setSplitPrices((p) => { const n = { ...p }; delete n[id]; return n; });
        setSplitQtys((q) => { const n = { ...q }; delete n[id]; return n; });
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectSource = (id: string) => {
    setSelectedSourceId((prev) => {
      if (prev === id) {
        clearAll();
        return null;
      }
      setSplitPrices({});
      setSplitQtys({});
      return id;
    });
  };

  const clearAll = () => {
    setSelectedUnsoldIds(new Set());
    setSelectedSourceId(null);
    setSplitPrices({});
    setSplitQtys({});
    setSourceQtyOverrides({});
  };

  const handleConfirm = async () => {
    if (!canConfirm || !sourceItem) return;
    setLoading("Staging split...");
    try {
      const newSplit = {
        source_auction_inventory_id: sourceItem.auction_inventory_id,
        splits: selectedUnsoldItems.map((item) => ({
          target_inventory_id: item.inventory_id,
          price: Number(getPriceForItem(item.inventory_id)),
          qty: getQtyForItem(item.inventory_id),
        })),
      };
      await saveDraft({
        ...state.draft,
        qty_splits: [
          ...state.draft.qty_splits.filter(
            (s) =>
              s.source_auction_inventory_id !== newSplit.source_auction_inventory_id,
          ),
          newSplit,
        ],
      });
      toast.success(`Split staged: ${selectedUnsoldItems.length} item(s).`);
      clearAll();
      await refresh();
    } finally {
      setLoading(null);
    }
  };

  const hasSelection = selectedUnsoldIds.size > 0 || selectedSourceId !== null;

  return (
    <StepShell
      step="qty-split"
      visibleSteps={visibleSteps}
      onBack={goBack}
      onJumpTo={goTo}
      jumpDisabled={jumpDisabled}
      onNext={goNext}
      nextLabel="Continue"
      loading={loading}
      description="Match UNSOLD items to a sold multi-qty entry. Select one or more UNSOLD items on the left, then select the source row on the right. Each selected UNSOLD will be recorded as a Bought Item at the split price."
    >
      <div className="grid grid-cols-2 gap-4 min-w-0">
        {/* UNSOLD */}
        <div className="min-w-0 flex flex-col gap-2">
          <p className="text-sm font-medium">
            UNSOLD{" "}
            <span className="text-muted-foreground font-normal">
              ({unsoldItems.length})
            </span>
          </p>
          <div className="border rounded overflow-auto max-h-[380px]">
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
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      No eligible UNSOLD items.
                    </TableCell>
                  </TableRow>
                ) : (
                  unsoldItems.map((item) => {
                    const selected = selectedUnsoldIds.has(item.inventory_id);
                    return (
                      <TableRow
                        key={item.inventory_id}
                        onClick={() => toggleUnsold(item.inventory_id)}
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

        {/* SOLD source */}
        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              SOLD{" "}
              <span className="text-muted-foreground font-normal">
                ({filteredSoldItems.length}
                {filteredSoldItems.length !== soldItems.length ? ` of ${soldItems.length}` : ""})
              </span>
            </p>
            <div className="flex items-center gap-1.5">
              <Checkbox
                id="show-all-sold"
                checked={showAllSold}
                onCheckedChange={(v) => setShowAllSold(v === true)}
              />
              <Label htmlFor="show-all-sold" className="text-xs font-normal cursor-pointer">
                Show all (incl. qty 1)
              </Label>
            </div>
          </div>
          <Input
            placeholder="Filter by description..."
            value={descFilter}
            onChange={(e) => setDescFilter(e.target.value)}
            className="text-sm"
          />
          <div className="border rounded overflow-auto max-h-[340px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Barcode</TableHead>
                  <TableHead>Ctrl</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSoldItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      {descFilter ? "No items match the filter." : "No sold items."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSoldItems.map((item) => {
                    const selected = item.auction_inventory_id === selectedSourceId;
                    return (
                      <TableRow
                        key={item.auction_inventory_id}
                        onClick={() => selectSource(item.auction_inventory_id)}
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
                          className="text-xs max-w-[100px] truncate"
                          title={item.description}
                        >
                          {item.description}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{item.qty}</TableCell>
                        <TableCell className="text-xs">{item.price.toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Split form */}
      {hasSelection && sourceItem && selectedUnsoldItems.length > 0 ? (
        <div className="mt-3 rounded-lg border bg-muted/40 p-3 flex flex-col gap-3">
          {/* header */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Source:{" "}
              <span className="font-mono font-medium text-foreground">{sourceItem.barcode}</span>
              {" — original "}
              <span className="font-medium">{sourceItem.price.toLocaleString()}</span>
            </span>
            <span className={isOverBudget ? "text-destructive text-xs font-medium" : "text-xs text-muted-foreground"}>
              Splits:{" "}
              <span className="font-medium">{splitTotal.toLocaleString()}</span>
              {" of "}
              <span className="font-medium">{sourceItem.price.toLocaleString()}</span>
              {isOverBudget && " — over budget!"}
            </span>
          </div>

          {/* two-column: inputs left, preview right */}
          <div className="grid grid-cols-2 gap-4 min-w-0">
            {/* inputs */}
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-[1fr_90px_70px] gap-2 text-xs text-muted-foreground px-1">
                <span>UNSOLD item</span>
                <span>Split price</span>
                <span>Qty</span>
              </div>
              {selectedUnsoldItems.map((item) => (
                <div key={item.inventory_id} className="grid grid-cols-[1fr_90px_70px] gap-2 items-center">
                  <div className="text-xs truncate min-w-0" title={`${item.barcode} — ${item.description}`}>
                    <span className="font-mono">{item.barcode}</span>
                    <span className="text-muted-foreground"> — {item.description}</span>
                  </div>
                  <Input
                    type="number"
                    min={1}
                    className="h-7 text-xs"
                    value={getPriceForItem(item.inventory_id)}
                    onChange={(e) =>
                      setSplitPrices((prev) => ({ ...prev, [item.inventory_id]: e.target.value }))
                    }
                  />
                  <Input
                    className="h-7 text-xs"
                    value={getQtyForItem(item.inventory_id)}
                    onChange={(e) =>
                      setSplitQtys((prev) => ({ ...prev, [item.inventory_id]: e.target.value }))
                    }
                  />
                </div>
              ))}
            </div>

            {/* live preview */}
            <div className="min-w-0 flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground px-1">Preview after split</p>
              <div className="border rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs py-1.5 whitespace-nowrap">Barcode</TableHead>
                      <TableHead className="text-xs py-1.5">Desc</TableHead>
                      <TableHead className="text-xs py-1.5">Qty</TableHead>
                      <TableHead className="text-xs py-1.5">Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* source row — reduced */}
                    <TableRow className="bg-amber-50 dark:bg-amber-950/20">
                      <TableCell className="font-mono text-xs py-1.5 whitespace-nowrap">
                        {sourceItem.barcode}
                      </TableCell>
                      <TableCell
                        className="text-xs py-1.5 max-w-[80px] truncate"
                        title={sourceItem.description}
                      >
                        {sourceItem.description}
                      </TableCell>
                      <TableCell className="py-1">
                        <Input
                          className="h-6 text-xs w-14"
                          value={getSourceQty()}
                          onChange={(e) =>
                            selectedSourceId &&
                            setSourceQtyOverrides((prev) => ({
                              ...prev,
                              [selectedSourceId]: e.target.value,
                            }))
                          }
                        />
                      </TableCell>
                      <TableCell className="text-xs py-1.5">
                        <span className="line-through text-muted-foreground mr-1">
                          {sourceItem.price.toLocaleString()}
                        </span>
                        <span className={isOverBudget ? "text-destructive font-medium" : "font-medium"}>
                          {remaining.toLocaleString()}
                        </span>
                      </TableCell>
                    </TableRow>
                    {/* new split rows */}
                    {selectedUnsoldItems.map((item) => {
                      const p = Number(getPriceForItem(item.inventory_id));
                      const validPrice = Number.isFinite(p) && p > 0;
                      return (
                        <TableRow key={item.inventory_id} className="bg-green-50 dark:bg-green-950/20">
                          <TableCell className="font-mono text-xs py-1.5 whitespace-nowrap">
                            {item.barcode}
                          </TableCell>
                          <TableCell
                            className="text-xs py-1.5 max-w-[80px] truncate"
                            title={item.description}
                          >
                            {item.description}
                          </TableCell>
                          <TableCell className="py-1">
                            <Input
                              className="h-6 text-xs w-14"
                              value={getQtyForItem(item.inventory_id)}
                              onChange={(e) =>
                                setSplitQtys((prev) => ({
                                  ...prev,
                                  [item.inventory_id]: e.target.value,
                                }))
                              }
                            />
                          </TableCell>
                          <TableCell className="text-xs py-1.5">
                            {validPrice ? (
                              <span className="font-medium text-green-700 dark:text-green-400">
                                {p.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-destructive">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
              Clear
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              disabled={!canConfirm}
            >
              Confirm Split
            </Button>
          </div>
        </div>
      ) : hasSelection ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {selectedSourceId && selectedUnsoldIds.size === 0
            ? "Select one or more UNSOLD items on the left to split from this source."
            : selectedUnsoldIds.size > 0 && !selectedSourceId
              ? "Select a source SOLD row on the right."
              : "Select items on both sides to configure the split."}
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Click UNSOLD items on the left (multi-select) and one SOLD row on the right to set up a split.
        </p>
      )}
    </StepShell>
  );
};
