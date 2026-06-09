"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowRight,
  Download,
  Filter,
  Package,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import type {
  FinalReportInventoryRow,
  FinalReportMonitoringRow,
} from "src/entities/models/FinalReport";
import { generateUnsold } from "@/app/lib/reports";
import { cn } from "@/app/lib/utils";
import { StepHeading } from "../shared/StepHeading";
import { clearResolution, findResolution } from "../shared/resolution";
import type { V2StepProps } from "../shared/types";
import { peso } from "../shared/format";

type FilterTab = "all" | "unsold" | "refunded";

type PaneState =
  | { kind: "merge"; sourceId: string }
  | { kind: "split"; sourceId: string }
  | null;

const pillVariant = {
  merge: "bg-primary/10 text-primary hover:bg-primary/15",
  buy: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900",
  split: "bg-primary/10 text-primary hover:bg-primary/15",
  void: "bg-destructive/10 text-destructive hover:bg-destructive/15",
} as const;

const activePillVariant = {
  merge: "bg-primary text-primary-foreground",
  buy: "bg-emerald-600 text-white",
  split: "bg-primary text-primary-foreground",
  void: "bg-destructive text-destructive-foreground",
} as const;

type PillKind = keyof typeof pillVariant;

const ActionPill = ({
  kind,
  label,
  Icon,
  active,
  disabled,
  onClick,
}: {
  kind: PillKind;
  label: string;
  Icon: typeof ArrowRight;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
      active ? activePillVariant[kind] : pillVariant[kind],
    )}
  >
    <Icon size={11} />
    {label}
  </button>
);

export const ResolveStep = ({
  preview,
  state,
  saveDraft,
  refresh,
}: V2StepProps) => {
  const [showResolved, setShowResolved] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [pane, setPane] = useState<PaneState>(null);
  const [buyPopoverFor, setBuyPopoverFor] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const allAttention = useMemo(
    () => preview?.unsold_items ?? [],
    [preview?.unsold_items],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return allAttention.filter((item) => {
      const status = item.auctions_inventory?.status ?? "UNSOLD";
      const isUnsold = status !== "REFUNDED";
      const isRefunded = status === "REFUNDED";
      if (filterTab === "unsold" && !isUnsold) return false;
      if (filterTab === "refunded" && !isRefunded) return false;
      if (q) {
        const hit = `${item.barcode} ${item.control} ${item.description}`
          .toUpperCase()
          .includes(q);
        if (!hit) return false;
      }
      const resolved = findResolution(state.draft, item.inventory_id);
      if (!showResolved && resolved) return false;
      return true;
    });
  }, [allAttention, filterTab, search, showResolved, state.draft]);

  const counts = useMemo(() => {
    const unsoldCount = allAttention.filter(
      (i) => (i.auctions_inventory?.status ?? "UNSOLD") !== "REFUNDED",
    ).length;
    const refundedCount = allAttention.filter(
      (i) => i.auctions_inventory?.status === "REFUNDED",
    ).length;
    return { all: allAttention.length, unsold: unsoldCount, refunded: refundedCount };
  }, [allAttention]);

  const remaining = useMemo(
    () =>
      allAttention.filter((i) => !findResolution(state.draft, i.inventory_id))
        .length,
    [allAttention, state.draft],
  );

  // Candidate lists
  const soldTwoPart = useMemo(() => {
    const originalTwoPartById = new Map(
      (preview?.appendable_unsold_items ?? []).map((item) => [
        item.inventory_id,
        item,
      ]),
    );

    return (preview?.report.monitoring ?? [])
      .map((row) => {
        const original = originalTwoPartById.get(row.inventory_id);
        return original
          ? {
              ...row,
              barcode: original.barcode,
              control: original.control,
            }
          : row;
      })
      .filter((row) => row.barcode.split("-").length === 2);
  }, [preview?.appendable_unsold_items, preview?.report.monitoring]);
  // SOLD lots that can absorb an UNSOLD item. A split carves price off the
  // source and adds a separate qty-1 row for the UNSOLD item — the source's
  // own qty is never reduced (see replay in get-final-report-preview). So a
  // qty-1 lot is a valid source too: it stays qty 1 and the UNSOLD item
  // becomes its own qty-1 row.
  const splitCandidates = useMemo(
    () =>
      (preview?.report.monitoring ?? []).filter(
        (row) =>
          row.bidder_number !== "5013" &&
          /^\d+$/.test(row.qty.trim()) &&
          Number(row.qty) >= 1,
      ),
    [preview?.report.monitoring],
  );

  const availableAuctions = useMemo(() => {
    const seen = new Set<string>();
    const out: { auction_id: string; auction_date: string }[] = [];
    for (const b of preview?.available_bidders ?? []) {
      if (seen.has(b.auction_id)) continue;
      seen.add(b.auction_id);
      out.push({ auction_id: b.auction_id, auction_date: b.auction_date });
    }
    return out;
  }, [preview?.available_bidders]);

  // Cumulative price already staged against each SOLD source (by auction
  // inventory id). When the user adds a new split to the same source, we
  // subtract this from the source's total to compute the remaining budget.
  // Without this cap, two ₱700 splits could be staged against a ₱1,000
  // source — replay clamps the source to 0 but still emits ₱1,400 of
  // synthetic rows, inflating monitoring + final totals.
  const existingSplitTotalByCandidate = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of state.draft.qty_splits) {
      const sum = s.splits.reduce((acc, sp) => acc + sp.price, 0);
      m.set(s.source_auction_inventory_id, sum);
    }
    return m;
  }, [state.draft.qty_splits]);

  if (!preview) {
    return (
      <div className="p-7 text-sm text-muted-foreground">
        Loading preview…
      </div>
    );
  }

  const runUpdate = async (
    label: string,
    mutate: () => Promise<void>,
  ) => {
    setWorking(true);
    try {
      await mutate();
      toast.success(label);
      await refresh();
    } catch {
      // saveDraft already surfaced the error via toast. We skip the
      // success/refresh path so the UI doesn't pretend the action stuck.
    } finally {
      setWorking(false);
    }
  };

  const handleVoid = (item: FinalReportInventoryRow) =>
    void runUpdate(`${item.barcode} staged as VOID.`, async () => {
      const next = clearResolution(state.draft, item.inventory_id);
      await saveDraft({
        ...next,
        bought_items: [
          ...next.bought_items,
          { action: "VOID", inventory_id: item.inventory_id },
        ],
      });
    });

  const handleBuyConfirm = (
    item: FinalReportInventoryRow,
    {
      price,
      qty,
      auctionId,
    }: { price: number; qty: string; auctionId: string },
  ) => {
    const bidderForAuction =
      preview.available_bidders.find(
        (b) =>
          b.auction_id === auctionId &&
          b.bidder_number === ATC_DEFAULT_BIDDER_NUMBER,
      ) ??
      preview.available_bidders.find((b) => b.auction_id === auctionId);
    if (!bidderForAuction) {
      toast.error("No bidder context available for this auction.");
      return;
    }
    void runUpdate(`${item.barcode} staged as Bought.`, async () => {
      const next = clearResolution(state.draft, item.inventory_id);
      await saveDraft({
        ...next,
        bought_items: [
          ...next.bought_items,
          {
            action: "BOUGHT",
            inventory_id: item.inventory_id,
            auction_id: auctionId,
            auction_bidder_id: bidderForAuction.auction_bidder_id,
            auction_date: bidderForAuction.auction_date,
            bidder_number: bidderForAuction.bidder_number,
            price,
            qty: qty.trim() || "1",
          },
        ],
      });
      setBuyPopoverFor(null);
    });
  };

  const handleMergeConfirm = (
    unsold: FinalReportInventoryRow,
    targetSoldInventoryId: string,
    targetAuctionInventoryId: string,
    controlChoice: "UNSOLD" | "SOLD" | undefined,
  ) =>
    void runUpdate("Merge staged.", async () => {
      const next = clearResolution(state.draft, unsold.inventory_id);
      await saveDraft({
        ...next,
        merged_inventories: [
          ...next.merged_inventories.filter(
            (m) =>
              m.old_inventory_id !== targetSoldInventoryId &&
              m.new_inventory_id !== unsold.inventory_id,
          ),
          {
            old_inventory_id: targetSoldInventoryId,
            new_inventory_id: unsold.inventory_id,
            ...(controlChoice ? { control_choice: controlChoice } : {}),
          },
        ],
        appended_inventory_ids: next.appended_inventory_ids.filter(
          (id) => id !== targetSoldInventoryId,
        ),
        qty_splits: next.qty_splits
          .filter(
            (s) => s.source_auction_inventory_id !== targetAuctionInventoryId,
          ),
      });
      setPane(null);
    });

  const handleSplitConfirm = (
    unsold: FinalReportInventoryRow,
    sourceAuctionInventoryId: string,
    price: number,
  ) =>
    void runUpdate("Split staged.", async () => {
      const next = clearResolution(state.draft, unsold.inventory_id);
      const existing = next.qty_splits.find(
        (s) => s.source_auction_inventory_id === sourceAuctionInventoryId,
      );
      const newEntry = {
        source_auction_inventory_id: sourceAuctionInventoryId,
        splits: [
          ...(existing?.splits ?? []),
          { target_inventory_id: unsold.inventory_id, price, qty: "1" },
        ],
      };
      await saveDraft({
        ...next,
        qty_splits: [
          ...next.qty_splits.filter(
            (s) => s.source_auction_inventory_id !== sourceAuctionInventoryId,
          ),
          newEntry,
        ],
      });
      setPane(null);
    });

  const handleUndo = (item: FinalReportInventoryRow) =>
    void runUpdate(`${item.barcode} undone.`, async () => {
      await saveDraft(clearResolution(state.draft, item.inventory_id));
    });

  const handlePrintUnresolved = () => {
    const unresolved = allAttention.filter(
      (i) => !findResolution(state.draft, i.inventory_id),
    );
    if (unresolved.length === 0) {
      toast.info("Nothing unresolved to print.");
      return;
    }
    generateUnsold(unresolved, preview.sheet_details.barcode);
  };

  const tabBtn = (key: FilterTab, label: string, count: number) => (
    <button
      type="button"
      onClick={() => setFilterTab(key)}
      className={cn(
        "rounded-md border px-3 py-1.5 text-[12.5px] font-medium transition",
        filterTab === key
          ? "border-foreground bg-foreground text-background"
          : "border-border text-muted-foreground hover:bg-muted/60",
      )}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] p-7">
      <StepHeading
        n={2}
        title="Resolve items that need attention"
        sub="These are the items that didn't sell cleanly. Pick one action per item — Merge, Buy, Split, or Void — until everything is decided."
      />

      {/* Validation bar */}
      <Card className="mb-3 flex flex-row items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-md",
              remaining > 0
                ? "bg-destructive/10 text-destructive"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
            )}
          >
            <Filter size={14} />
          </div>
          <div className="leading-tight">
            <div className="text-[13.5px] font-semibold">
              {remaining > 0
                ? `${remaining} of ${counts.all} items still need a decision`
                : `All ${counts.all} items resolved`}
            </div>
            <div className="text-[12px] text-muted-foreground">
              {remaining > 0
                ? "Choose Merge, Buy, Split, or Void for each. You can continue once everything is decided."
                : "You can apply the tax deduction."}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-1.5 text-[12px]">
            <Checkbox
              checked={showResolved}
              onCheckedChange={(v) => setShowResolved(v === true)}
            />
            Show resolved
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintUnresolved}
          >
            <Download size={13} /> Print remaining unresolved
          </Button>
        </div>
      </Card>

      {/* Filter tabs */}
      <div className="mb-3 flex items-center gap-2">
        {tabBtn("all", "All to resolve", counts.all)}
        {tabBtn("unsold", "UNSOLD", counts.unsold)}
        {tabBtn("refunded", "REFUNDED", counts.refunded)}
        <div className="ml-auto">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="h-8 w-[220px] pl-7 text-[13px]"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Barcode</TableHead>
              <TableHead className="w-[80px]">Control</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[50px] text-center">Qty</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[320px]">What to do</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-sm text-muted-foreground"
                >
                  Nothing matches.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => {
                const status =
                  item.auctions_inventory?.status === "REFUNDED"
                    ? "REFUNDED"
                    : "UNSOLD";
                const isCancelled =
                  item.auctions_inventory?.status === "CANCELLED";
                const resolution = findResolution(state.draft, item.inventory_id);
                const resolved = resolution !== null;
                return (
                  <TableRow
                    key={item.inventory_id}
                    className={
                      resolved ? "bg-emerald-50/60 dark:bg-emerald-950/20" : ""
                    }
                  >
                    <TableCell className="font-mono text-[12.5px] font-semibold">
                      {item.barcode}
                    </TableCell>
                    <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                      {item.control}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-[13px]",
                        resolution?.kind === "void" && "line-through text-muted-foreground",
                      )}
                    >
                      {item.description}
                    </TableCell>
                    <TableCell className="text-center font-mono text-[12.5px]">
                      {item.auctions_inventory?.qty ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.04em]",
                          status === "REFUNDED"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                        )}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {resolved ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11.5px] font-semibold",
                              pillVariant[resolution.kind],
                            )}
                          >
                            {resolution.kind === "merge"
                              ? `Merged into ${
                                  preview.report.monitoring.find(
                                    (m) =>
                                      m.inventory_id ===
                                      resolution.targetSoldInventoryId,
                                  )?.barcode ?? "SOLD"
                                }`
                              : resolution.kind === "buy"
                                ? `Bought · ${peso(resolution.price)}`
                                : resolution.kind === "split"
                                  ? `Split · ${peso(resolution.price)}`
                                  : "Voided · not in report"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11.5px]"
                            onClick={() => handleUndo(item)}
                            disabled={working}
                          >
                            Undo
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <ActionPill
                            kind="merge"
                            label="Merge"
                            Icon={ArrowRight}
                            disabled={working || isCancelled}
                            onClick={() =>
                              setPane({
                                kind: "merge",
                                sourceId: item.inventory_id,
                              })
                            }
                          />
                          <Popover
                            open={buyPopoverFor === item.inventory_id}
                            onOpenChange={(open) =>
                              setBuyPopoverFor(open ? item.inventory_id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                disabled={working || isCancelled}
                                className={cn(
                                  "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
                                  pillVariant.buy,
                                )}
                              >
                                <Package size={11} /> Buy
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[280px] p-3">
                              <BuyForm
                                onCancel={() => setBuyPopoverFor(null)}
                                onSubmit={(values) =>
                                  handleBuyConfirm(item, values)
                                }
                                auctions={availableAuctions}
                              />
                            </PopoverContent>
                          </Popover>
                          <ActionPill
                            kind="split"
                            label="Split"
                            Icon={Filter}
                            disabled={working || isCancelled}
                            onClick={() =>
                              setPane({
                                kind: "split",
                                sourceId: item.inventory_id,
                              })
                            }
                          />
                          <ActionPill
                            kind="void"
                            label="Void"
                            Icon={X}
                            disabled={working}
                            onClick={() => handleVoid(item)}
                          />
                          {isCancelled ? (
                            <span className="text-[11px] text-destructive">
                              Cancelled — void only
                            </span>
                          ) : null}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {(
          [
            { kind: "merge", label: "Merge", Icon: ArrowRight, desc: "Attach this UNSOLD to a similar SOLD record (1:1)." },
            { kind: "buy", label: "Buy", Icon: Package, desc: "Sell it to the house bidder at a chosen price." },
            { kind: "split", label: "Split", Icon: Filter, desc: "Absorb into a SOLD lot, carving off part of its price. Original row untouched." },
            { kind: "void", label: "Void", Icon: X, desc: "Remove from the final report. Use for missing or broken items." },
          ] as const
        ).map((entry) => (
          <Card
            key={entry.kind}
            className="flex flex-col gap-1.5 p-3"
          >
            <ActionPill
              kind={entry.kind}
              label={entry.label}
              Icon={entry.Icon}
            />
            <p className="text-[12px] text-muted-foreground">{entry.desc}</p>
          </Card>
        ))}
      </div>

      {/* Slide-in pane (Merge or Split) */}
      <Sheet
        open={pane !== null}
        onOpenChange={(open) => !open && setPane(null)}
      >
        <SheetContent className="w-[420px] sm:max-w-[420px]">
          {pane?.kind === "merge" ? (
            <MergePaneBody
              unsold={
                allAttention.find((i) => i.inventory_id === pane.sourceId)!
              }
              candidates={soldTwoPart}
              disabled={working}
              onConfirm={(target, controlChoice) =>
                handleMergeConfirm(
                  allAttention.find((i) => i.inventory_id === pane.sourceId)!,
                  target.inventory_id,
                  target.auction_inventory_id,
                  controlChoice,
                )
              }
            />
          ) : pane?.kind === "split" ? (
            <SplitPaneBody
              unsold={
                allAttention.find((i) => i.inventory_id === pane.sourceId)!
              }
              candidates={splitCandidates}
              existingTotalsByCandidate={existingSplitTotalByCandidate}
              disabled={working}
              onConfirm={(target, price) =>
                handleSplitConfirm(
                  allAttention.find((i) => i.inventory_id === pane.sourceId)!,
                  target.auction_inventory_id,
                  price,
                )
              }
            />
          ) : null}
        </SheetContent>
      </Sheet>

    </div>
  );
};

// ─── Buy popover form ───────────────────────────────────────────────────

const BuyForm = ({
  onCancel,
  onSubmit,
  auctions,
}: {
  onCancel: () => void;
  onSubmit: (v: { price: number; qty: string; auctionId: string }) => void;
  auctions: { auction_id: string; auction_date: string }[];
}) => {
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("1");
  const [auctionId, setAuctionId] = useState(auctions[0]?.auction_id ?? "");

  const priceNum = Number(price);
  const canSubmit =
    Number.isFinite(priceNum) && priceNum > 0 && qty.trim().length > 0 &&
    auctionId.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[13px] font-semibold">Mark as Bought</div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">Price</label>
          <Input
            type="number"
            min={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="h-8 text-[13px]"
            placeholder="0"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">Qty</label>
          <Input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="h-8 text-[13px]"
          />
        </div>
      </div>
      {auctions.length > 1 ? (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-muted-foreground">Auction</label>
          <select
            value={auctionId}
            onChange={(e) => setAuctionId(e.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-[13px]"
          >
            {auctions.map((a) => (
              <option key={a.auction_id} value={a.auction_id}>
                {a.auction_date}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        Will be staged under bidder 5013. In the workbook, that bidder is
        replaced with a random non-5013 bidder from the same auction.
      </p>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={() => onSubmit({ price: priceNum, qty, auctionId })}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
};

// ─── Merge slide-in pane ─────────────────────────────────────────────────

const MergePaneBody = ({
  unsold,
  candidates,
  disabled,
  onConfirm,
}: {
  unsold: FinalReportInventoryRow;
  candidates: FinalReportMonitoringRow[];
  disabled: boolean;
  onConfirm: (
    target: FinalReportMonitoringRow,
    controlChoice: "UNSOLD" | "SOLD" | undefined,
  ) => void;
}) => {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const picked = candidates.find((c) => c.inventory_id === pickedId);

  const filtered = q
    ? candidates.filter((c) =>
        `${c.barcode} ${c.control} ${c.description}`
          .toUpperCase()
          .includes(q.toUpperCase()),
      )
    : candidates;

  const needsControlPrompt = Boolean(
    picked && unsold.control !== "0000" && unsold.control !== "00NC" &&
      picked.control !== unsold.control,
  );

  return (
    <>
      <SheetHeader>
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Merge into
        </div>
        <SheetTitle className="text-[15px]">
          <span className="font-mono">{unsold.barcode}</span> · Control:{" "}
          <span className="font-mono">{unsold.control}</span> · {unsold.description}
        </SheetTitle>
        <p className="text-[12.5px] text-muted-foreground">
          Pick the SOLD record this UNSOLD item should be attached to. Strictly 1:1.
        </p>
      </SheetHeader>

      <div className="border-y px-[18px] py-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="h-8 text-[13px]"
        />
      </div>

      <div className="flex-1 overflow-auto px-2.5 py-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-[12.5px] text-muted-foreground">
            No candidates.
          </p>
        ) : (
          filtered.map((c) => {
            const active = pickedId === c.inventory_id;
            return (
              <Tooltip key={c.auction_inventory_id}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setPickedId(c.inventory_id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left transition",
                      active
                        ? "border-primary bg-primary/5 border-[1.5px]"
                        : "border-transparent hover:bg-muted/60",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
                        active ? "border-primary" : "border-muted-foreground/40",
                      )}
                    >
                      {active ? (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px]">
                        <span className="font-mono font-semibold">{c.barcode}</span>{" "}
                        · {c.description}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        Control: <span className="font-mono">{c.control}</span> · Bidder{" "}
                        {c.bidder_number} · Qty {c.qty} · {peso(c.price)}
                      </div>
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="space-y-0.5 text-xs">
                  <div>Auction date: {c.auction_date}</div>
                  <div>Manifest number: {c.manifest_number ?? "-"}</div>
                </TooltipContent>
              </Tooltip>
            );
          })
        )}
      </div>

      <div className="border-t bg-muted/30 px-[18px] py-3.5">
        {needsControlPrompt ? (
          <div className="mb-3 rounded-md border bg-background p-2.5 text-[12px]">
            <div className="mb-1.5 font-medium">Different control numbers</div>
            <div className="text-muted-foreground">
              UNSOLD: <span className="font-mono">{unsold.control}</span> · SOLD:{" "}
              <span className="font-mono">{picked!.control}</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                disabled={disabled}
                onClick={() => onConfirm(picked!, "UNSOLD")}
              >
                Use UNSOLD
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={disabled}
                onClick={() => onConfirm(picked!, "SOLD")}
              >
                Use SOLD
              </Button>
            </div>
          </div>
        ) : null}
        <Button
          type="button"
          className="h-10 w-full font-semibold"
          disabled={!picked || disabled || needsControlPrompt}
          onClick={() => picked && onConfirm(picked, undefined)}
        >
          {picked ? `Merge into ${picked.barcode}` : "Pick a candidate"}
        </Button>
      </div>
    </>
  );
};

// ─── Split slide-in pane ─────────────────────────────────────────────────

const SplitPaneBody = ({
  unsold,
  candidates,
  existingTotalsByCandidate,
  disabled,
  onConfirm,
}: {
  unsold: FinalReportInventoryRow;
  candidates: FinalReportMonitoringRow[];
  // Sum of prices for splits already staged against each source. We cap
  // new splits at (source.price - existing) so the cumulative amount never
  // exceeds what the source row actually carries.
  existingTotalsByCandidate: Map<string, number>;
  disabled: boolean;
  onConfirm: (target: FinalReportMonitoringRow, price: number) => void;
}) => {
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [q, setQ] = useState("");
  const [sameDescOnly, setSameDescOnly] = useState(true);
  const [multiQtyOnly, setMultiQtyOnly] = useState(false);

  const picked = candidates.find((c) => c.auction_inventory_id === pickedId);

  // Default per-unit price. A multi-qty lot divides by its existing qty
  // (a 2-qty lot at ₱10,000 suggests ₱5,000); a qty-1 lot has no existing
  // per-unit split, so splitting it produces two units — suggest half.
  const autoPrice = picked
    ? Math.round(picked.price / Math.max(2, Number(picked.qty)) / 100) * 100
    : 0;

  const effectivePrice =
    priceInput.trim() === "" ? autoPrice : Number(priceInput);

  const normalizedUnsoldDesc = unsold.description.trim().toUpperCase();
  const sameDescMatches = candidates.filter(
    (c) => c.description.trim().toUpperCase() === normalizedUnsoldDesc,
  );
  const multiQtyMatches = candidates.filter((c) => Number(c.qty) > 1);
  const baseCandidates =
    sameDescOnly && sameDescMatches.length > 0 ? sameDescMatches : candidates;
  const qtyFiltered =
    multiQtyOnly && multiQtyMatches.length > 0
      ? baseCandidates.filter((c) => Number(c.qty) > 1)
      : baseCandidates;
  const filtered = q
    ? qtyFiltered.filter((c) =>
        `${c.barcode} ${c.control} ${c.description}`
          .toUpperCase()
          .includes(q.toUpperCase()),
      )
    : qtyFiltered;

  return (
    <>
      <SheetHeader>
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Split from
        </div>
        <SheetTitle className="text-[15px]">
          <span className="font-mono">{unsold.barcode}</span> · {unsold.description}
        </SheetTitle>
        <p className="text-[12.5px] text-muted-foreground">
          Pick a SOLD lot. We&apos;ll carve part of its price into this UNSOLD
          item as a separate qty-1 row — the SOLD lot keeps its own qty.
        </p>
      </SheetHeader>

      <div className="flex flex-col gap-2 border-y px-[18px] py-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search SOLD lots…"
          className="h-8 text-[13px]"
        />
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
          <Checkbox
            checked={sameDescOnly}
            onCheckedChange={(v) => setSameDescOnly(v === true)}
            disabled={sameDescMatches.length === 0}
          />
          <span>
            Same description only
            {sameDescMatches.length > 0 ? (
              <span className="ml-1 opacity-70">
                ({sameDescMatches.length}{" "}
                {sameDescMatches.length === 1 ? "match" : "matches"})
              </span>
            ) : (
              <span className="ml-1 opacity-70">
                (none — showing all)
              </span>
            )}
          </span>
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-muted-foreground">
          <Checkbox
            checked={multiQtyOnly}
            onCheckedChange={(v) => setMultiQtyOnly(v === true)}
            disabled={multiQtyMatches.length === 0}
          />
          <span>
            Multi-qty only
            {multiQtyMatches.length > 0 ? (
              <span className="ml-1 opacity-70">
                ({multiQtyMatches.length}{" "}
                {multiQtyMatches.length === 1 ? "lot" : "lots"})
              </span>
            ) : (
              <span className="ml-1 opacity-70">
                (none — showing all)
              </span>
            )}
          </span>
        </label>
      </div>

      <div className="flex-1 overflow-auto px-2.5 py-2">
        {filtered.length === 0 ? (
          <p className="px-2 py-4 text-[12.5px] text-muted-foreground">
            No SOLD lots available.
          </p>
        ) : (
          filtered.map((c) => {
            const active = pickedId === c.auction_inventory_id;
            const existingTotal =
              existingTotalsByCandidate.get(c.auction_inventory_id) ?? 0;
            const remainingBudget = Math.max(0, c.price - existingTotal);
            // Suggested per-unit, capped by remaining budget so we don't
            // hint a value the confirm button would reject.
            const suggest = Math.min(
              remainingBudget,
              Math.round(c.price / Math.max(2, Number(c.qty)) / 100) * 100,
            );
            return (
              <button
                key={c.auction_inventory_id}
                type="button"
                onClick={() => setPickedId(c.auction_inventory_id)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-md border px-3 py-2 text-left transition",
                  active
                    ? "border-primary bg-primary/5 border-[1.5px]"
                    : "border-transparent hover:bg-muted/60",
                )}
              >
                <span
                  className={cn(
                    "mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border",
                    active ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  {active ? (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  ) : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px]">
                    <span className="font-mono font-semibold">{c.barcode}</span>{" "}
                    · {c.description}
                  </div>
                  <div className="text-[11.5px] text-muted-foreground">
                    Bidder {c.bidder_number} · Qty {c.qty} · {peso(c.price)} ·
                    Suggest {peso(suggest)} each
                    {existingTotal > 0 ? (
                      <>
                        {" · "}
                        <span className="text-foreground/70">
                          {peso(existingTotal)} already split
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="border-t bg-muted/30 px-[18px] py-3.5">
        {picked ? (
          <>
            <div className="mb-2.5 flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">₱</span>
              <Input
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder={String(autoPrice)}
                className="h-8 text-[13px]"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPriceInput("")}
                className="shrink-0 text-[11.5px]"
              >
                Reset to auto
              </Button>
            </div>
            {(() => {
              const existingTotal =
                existingTotalsByCandidate.get(picked.auction_inventory_id) ?? 0;
              const remainingBudget = Math.max(0, picked.price - existingTotal);
              return (
                <p className="mb-2.5 text-[11px] text-muted-foreground">
                  Auto: {peso(autoPrice)}. Max: {peso(remainingBudget)}
                  {existingTotal > 0
                    ? ` (${peso(picked.price)} − ${peso(existingTotal)} already split)`
                    : " (the SOLD lot's total)"}
                  . Workbook only — original SOLD record stays unchanged.
                </p>
              );
            })()}
          </>
        ) : null}
        {(() => {
          // Remaining budget = source price minus the cumulative amount of
          // splits already staged against it. Reject anything over that, or
          // the replay would clamp the source to 0 while still emitting the
          // full split rows, inflating monitoring + final totals.
          const existingTotal = picked
            ? existingTotalsByCandidate.get(picked.auction_inventory_id) ?? 0
            : 0;
          const remainingBudget = picked
            ? Math.max(0, picked.price - existingTotal)
            : 0;
          const valid =
            Boolean(picked) &&
            Number.isFinite(effectivePrice) &&
            effectivePrice > 0 &&
            effectivePrice <= remainingBudget;
          return (
            <Button
              type="button"
              className="h-10 w-full font-semibold"
              disabled={!picked || disabled || !valid}
              onClick={() => valid && picked && onConfirm(picked, effectivePrice)}
            >
              {picked
                ? valid
                  ? `Apply split · move ${peso(effectivePrice)} from ${picked.barcode}`
                  : !Number.isFinite(effectivePrice) || effectivePrice <= 0
                    ? "Enter a valid split price"
                    : `Over budget · max ${peso(remainingBudget)}`
                : "Pick a candidate"}
            </Button>
          );
        })()}
      </div>
    </>
  );
};
