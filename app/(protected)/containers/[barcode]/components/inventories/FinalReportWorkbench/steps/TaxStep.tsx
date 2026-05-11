"use client";

import { useEffect, useMemo, useRef, useState, KeyboardEvent } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Info } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { StepShell } from "../shared/StepShell";
import { StepProps } from "../shared/types";

type SortCol = "control" | "description" | "price" | "deducted";
type SortDir = "asc" | "desc";

export const TaxStep = ({
  preview,
  visibleSteps,
  goBack,
  goNext,
  goTo,
  jumpDisabled,
  loading,
  state,
  saveDraft,
}: StepProps) => {
  const previewKey = preview
    ? preview.report.monitoring.map((item) => item.auction_inventory_id).join("::")
    : "";

  const [phase, setPhase] = useState<"filter" | "table">("filter");
  const [descSearch, setDescSearch] = useState("");
  const [selectedDescs, setSelectedDescs] = useState<Set<string>>(new Set());
  const [confirmedDescs, setConfirmedDescs] = useState<Set<string> | null>(null);
  const [tableSearch, setTableSearch] = useState("");
  const [sortCol, setSortCol] = useState<SortCol | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  // Local input state, keyed by auction_inventory_id (one per monitoring row).
  const [edits, setEdits] = useState<Record<string, string>>({});
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Pre-loaded edits from the draft, keyed by `barcode|control` (stable across sessions).
  const draftEditsByBarcodeControl = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of state.draft.tax_edits) {
      map.set(`${e.barcode}|${e.control}`, e.deducted_amount);
    }
    return map;
  }, [state.draft.tax_edits]);

  const allDescs = useMemo(() => {
    if (!preview) return [];
    return Array.from(
      new Set(preview.report.monitoring.map((item) => item.description)),
    ).sort();
  }, [previewKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const serverDeductionDescs = useMemo(() => {
    if (!preview) return new Set<string>();
    return new Set(preview.report.deductions.map((item) => item.description));
  }, [previewKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Descriptions of monitoring rows that have a saved deduction in the draft —
  // these get pre-selected in phase 1 so the user can see/edit them again.
  const draftDeductionDescs = useMemo(() => {
    if (!preview) return new Set<string>();
    const result = new Set<string>();
    for (const row of preview.report.monitoring) {
      if (draftEditsByBarcodeControl.has(`${row.barcode}|${row.control}`)) {
        result.add(row.description);
      }
    }
    return result;
  }, [previewKey, draftEditsByBarcodeControl]); // eslint-disable-line react-hooks/exhaustive-deps

  const deductionMap = useMemo(() => {
    if (!preview) return new Map<string, number>();
    return new Map(
      preview.report.deductions.map((item) => [
        `${item.control}|${item.bidder_number}|${item.description}`,
        item.deducted_amount,
      ]),
    );
  }, [previewKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSelectedDescs(new Set([...serverDeductionDescs, ...draftDeductionDescs]));
    setConfirmedDescs(null);
    setPhase("filter");
    setDescSearch("");
    setTableSearch("");
    setSortCol(null);
    setSortDir("asc");
    setEdits({});
    setBoughtItemNoticeShown(false);
  }, [previewKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredDescs = useMemo(() => {
    const q = descSearch.trim().toUpperCase();
    return q ? allDescs.filter((d) => d.toUpperCase().includes(q)) : allDescs;
  }, [allDescs, descSearch]);

  const allFilteredChecked =
    filteredDescs.length > 0 && filteredDescs.every((d) => selectedDescs.has(d));

  const toggleDesc = (desc: string) =>
    setSelectedDescs((prev) => {
      const next = new Set(prev);
      if (next.has(desc)) next.delete(desc);
      else next.add(desc);
      return next;
    });

  const toggleAll = () =>
    setSelectedDescs((prev) => {
      const next = new Set(prev);
      if (allFilteredChecked) {
        filteredDescs.forEach((d) => next.delete(d));
      } else {
        filteredDescs.forEach((d) => next.add(d));
      }
      return next;
    });

  // Bidder 0740 deduction rows — always shown separately, not editable in main table.
  const bidder740Rows = useMemo(() => {
    if (!preview) return [];
    return preview.report.deductions.filter((item) => item.bidder_number === "0740");
  }, [previewKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const bidder740Total = useMemo(
    () => bidder740Rows.reduce((acc, item) => acc + item.deducted_amount, 0),
    [bidder740Rows],
  );

  // Monitoring rows for confirmed descriptions, excluding 0740 (handled
  // separately) AND bought items (their deductions don't reduce the monitoring
  // sheet price, so showing them here would be misleading).
  const confirmedRows = useMemo(() => {
    if (!preview || confirmedDescs === null) return [];
    return preview.report.monitoring.filter(
      (row) =>
        confirmedDescs.has(row.description) &&
        row.bidder_number !== "0740" &&
        !row.was_bought_item,
    );
  }, [preview, confirmedDescs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Count bought items that match the user's filter selection — shown in the
  // banner + dialog so the user understands why their bought items aren't here.
  const excludedBoughtItemsCount = useMemo(() => {
    if (!preview || confirmedDescs === null) return 0;
    return preview.report.monitoring.filter(
      (row) =>
        confirmedDescs.has(row.description) &&
        row.bidder_number !== "0740" &&
        row.was_bought_item,
    ).length;
  }, [preview, confirmedDescs]); // eslint-disable-line react-hooks/exhaustive-deps

  // One-shot dialog: opens the first time the user transitions to phase 2 in
  // this session if there are bought items in their selection.
  const [boughtItemNoticeOpen, setBoughtItemNoticeOpen] = useState(false);
  const [boughtItemNoticeShown, setBoughtItemNoticeShown] = useState(false);

  const tableRows = useMemo(
    () =>
      confirmedRows.map((row) => {
        const key = `${row.control}|${row.bidder_number}|${row.description}`;
        const defaultDeduction = deductionMap.get(key) ?? 0;
        // Persisted edit from the draft takes precedence over the server's default;
        // local in-progress edit (`edits`) takes precedence over both.
        const persistedEdit = draftEditsByBarcodeControl.get(
          `${row.barcode}|${row.control}`,
        );
        const edited = edits[row.auction_inventory_id];
        const rawDeduction =
          edited !== undefined
            ? Number.isFinite(Number(edited)) ? Number(edited) : 0
            : persistedEdit !== undefined
              ? persistedEdit
              : defaultDeduction;
        // The monitoring sheet uses bought_item_price for bought items, row.price
        // for everything else. For non-bought items, the server's preview has
        // already subtracted any previously-saved deduction from row.price, so we
        // reconstruct the ORIGINAL pre-deduction price by adding the saved
        // deduction back. For bought items, bought_item_price is not modified by
        // the server's deduction logic, so it's already gross.
        const sheet_price =
          row.was_bought_item && row.bought_item_price != null
            ? row.bought_item_price
            : row.price;
        const gross_price =
          row.was_bought_item && row.bought_item_price != null
            ? sheet_price
            : sheet_price + (persistedEdit ?? 0);
        // Floor the new price at 100, so the maximum deduction is gross_price - 100.
        // (If the item already costs less than 100, the deduction is forced to 0.)
        const maxDeduction = Math.max(0, gross_price - 100);
        const deducted_amount = Math.min(Math.max(rawDeduction, 0), maxDeduction);
        return { ...row, deducted_amount, original_price: gross_price };
      }),
    [confirmedRows, deductionMap, edits, draftEditsByBarcodeControl],
  );

  const visibleRows = useMemo(() => {
    let rows = tableRows;

    const q = tableSearch.trim().toUpperCase();
    if (q) {
      rows = rows.filter(
        (row) =>
          row.control.toUpperCase().includes(q) ||
          row.description.toUpperCase().includes(q) ||
          String(row.original_price).includes(q),
      );
    }

    if (sortCol) {
      rows = [...rows].sort((a, b) => {
        let av: string | number;
        let bv: string | number;
        if (sortCol === "control") { av = a.control; bv = b.control; }
        else if (sortCol === "description") { av = a.description; bv = b.description; }
        else if (sortCol === "price") { av = a.original_price; bv = b.original_price; }
        else { av = a.deducted_amount; bv = b.deducted_amount; }

        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    return rows;
  }, [tableRows, tableSearch, sortCol, sortDir]);

  const itemsTotal = tableRows.reduce((acc, row) => acc + row.deducted_amount, 0);
  const grandTotal = bidder740Total + itemsTotal;
  // row.original_price is the gross (pre-deduction) price; deducted_amount is
  // the staged deduction. Net Total = gross - deducted, which matches what the
  // monitoring sheet's price column will show when the user's deductions are
  // committed (since the server applies the same subtraction to row.price).
  const itemsPriceTotal = tableRows.reduce((acc, row) => acc + row.original_price, 0);
  const netTotal = itemsPriceTotal - itemsTotal;

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
    event.preventDefault();
    const next = inputRefs.current[index + (event.key === "ArrowUp" ? -1 : 1)];
    if (next) { next.focus(); next.select(); }
  };

  const cycleSort = (col: SortCol) => {
    if (sortCol !== col) {
      setSortCol(col);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortCol(null);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ col }: { col: SortCol }) => {
    if (sortCol !== col) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 h-3 w-3 inline" />
      : <ArrowDown className="ml-1 h-3 w-3 inline" />;
  };

  // Persist only rows that have an active deduction (> 0), keyed by barcode+control.
  // Combines the existing draft entries with any in-progress local edits in `edits`,
  // so the saved snapshot reflects whatever the user sees right now.
  const taxEditsForDraft = () => {
    const merged = new Map<string, { barcode: string; control: string; deducted_amount: number }>();
    for (const r of tableRows) {
      if (r.deducted_amount > 0) {
        merged.set(`${r.barcode}|${r.control}`, {
          barcode: r.barcode,
          control: r.control,
          deducted_amount: r.deducted_amount,
        });
      }
    }
    return Array.from(merged.values());
  };

  if (!preview) return null;

  const showFilter = phase === "filter";

  return (
    <StepShell
      step="tax"
      visibleSteps={visibleSteps}
      onBack={goBack}
      onJumpTo={goTo}
      jumpDisabled={jumpDisabled}
      onNext={async () => {
        // Preserve previously-saved tax_edits if the user never engaged with the
        // table in this session (still in phase 1 / never clicked Confirm), or
        // if the result would be empty but the draft already had saved entries
        // (accidental clear). Either way, just navigate without overriding.
        const newEdits = taxEditsForDraft();
        const userEngaged = confirmedDescs !== null;
        const wouldClearExisting =
          newEdits.length === 0 && state.draft.tax_edits.length > 0;
        if (userEngaged && !wouldClearExisting) {
          await saveDraft({ ...state.draft, tax_edits: newEdits });
        }
        goNext();
      }}
      nextLabel="Continue"
      loading={loading}
      description={
        showFilter
          ? "Select which item descriptions should have their price deducted, then confirm."
          : "Deduction amounts assumed per monitoring row for the generated report."
      }
    >
      {showFilter ? (
        <div className="flex flex-col gap-3">
          <Input
            placeholder="Search descriptions..."
            value={descSearch}
            onChange={(e) => setDescSearch(e.target.value)}
            className="text-sm"
          />
          <div className="flex items-center gap-2 pb-1 border-b">
            <Checkbox
              id="tax-select-all"
              checked={allFilteredChecked}
              onCheckedChange={toggleAll}
            />
            <Label htmlFor="tax-select-all" className="text-sm font-medium cursor-pointer">
              {allFilteredChecked ? "Deselect all" : "Select all"}
            </Label>
            <span className="ml-auto text-xs text-muted-foreground">
              {selectedDescs.size} of {allDescs.length} selected
            </span>
          </div>
          <div className="border rounded max-h-[320px] overflow-y-auto flex flex-col divide-y">
            {filteredDescs.length === 0 ? (
              <p className="text-sm text-muted-foreground px-3 py-4">No descriptions match.</p>
            ) : (
              filteredDescs.map((desc) => (
                <label
                  key={desc}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50 text-sm"
                >
                  <Checkbox
                    checked={selectedDescs.has(desc)}
                    onCheckedChange={() => toggleDesc(desc)}
                  />
                  <span>{desc}</span>
                </label>
              ))
            )}
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                const newConfirmed = new Set(selectedDescs);
                setConfirmedDescs(newConfirmed);
                setPhase("table");
                // Open the one-shot dialog if the selection includes any bought
                // items and we haven't shown it yet in this session.
                if (!preview || boughtItemNoticeShown) return;
                const hasBoughtItems = preview.report.monitoring.some(
                  (row) =>
                    newConfirmed.has(row.description) &&
                    row.bidder_number !== "0740" &&
                    row.was_bought_item,
                );
                if (hasBoughtItems) {
                  setBoughtItemNoticeOpen(true);
                  setBoughtItemNoticeShown(true);
                }
              }}
            >
              Confirm
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-4 min-w-0">
          {/* Main editable table */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setPhase("filter")}
              >
                Back to filter
              </Button>
              <Input
                placeholder="Search ctrl, description, price..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="text-sm h-8"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {visibleRows.length}{visibleRows.length !== tableRows.length ? ` of ${tableRows.length}` : ""} item{tableRows.length !== 1 ? "s" : ""}
              </span>
            </div>
            {excludedBoughtItemsCount > 0 ? (
              <div className="flex items-center gap-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>
                  <span className="font-medium">{excludedBoughtItemsCount}</span>{" "}
                  bought item{excludedBoughtItemsCount === 1 ? "" : "s"} hidden — not eligible for tax deduction.
                </span>
              </div>
            ) : null}
            <div className="border rounded max-h-[400px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => cycleSort("control")}>
                      Ctrl <SortIcon col="control" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => cycleSort("description")}>
                      Description <SortIcon col="description" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => cycleSort("price")}>
                      Price <SortIcon col="price" />
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => cycleSort("deducted")}>
                      Deducted <SortIcon col="deducted" />
                    </TableHead>
                    <TableHead className="whitespace-nowrap">New Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">
                        No items match.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((row, index) => (
                      <TableRow key={row.auction_inventory_id}>
                        <TableCell className="py-1 text-xs">{row.control}</TableCell>
                        <TableCell className="py-1 text-xs">{row.description}</TableCell>
                        <TableCell
                          className={`py-1 text-xs ${row.deducted_amount > 0 ? "line-through text-muted-foreground" : ""}`}
                        >
                          {row.original_price.toLocaleString()}
                        </TableCell>
                        <TableCell className="py-1">
                          <input
                            ref={(el) => { inputRefs.current[index] = el; }}
                            type="number"
                            min={0}
                            max={Math.max(0, row.original_price - 100)}
                            className="w-20 h-6 px-2 text-xs border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none bg-transparent"
                            value={
                              edits[row.auction_inventory_id] !== undefined
                                ? edits[row.auction_inventory_id]
                                : String(row.deducted_amount)
                            }
                            onChange={(e) => {
                              const raw = e.target.value;
                              // Clamp so the new price (original_price - deducted) is at least 100.
                              const maxDeduction = Math.max(0, row.original_price - 100);
                              const num = Number(raw);
                              const clamped =
                                raw === ""
                                  ? raw
                                  : Number.isFinite(num)
                                    ? String(Math.min(Math.max(num, 0), maxDeduction))
                                    : raw;
                              setEdits((prev) => ({
                                ...prev,
                                [row.auction_inventory_id]: clamped,
                              }));
                            }}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                          />
                        </TableCell>
                        <TableCell className="py-1 text-xs">
                          {(row.original_price - row.deducted_amount).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Breakdown panel */}
          <div className="w-[282px] shrink-0 flex flex-col gap-3 border rounded p-3 self-start">
            <p className="text-sm font-medium uppercase tracking-wide">Breakdown</p>

            {/* Bidder 0740 items — only shown when rows exist */}
            {bidder740Rows.length > 0 && (
              <div className="border rounded overflow-hidden">
                <Table>
                  <TableBody>
                    {bidder740Rows.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="py-1 text-sm truncate max-w-[120px] uppercase" title={item.description}>
                          {item.control} — {item.description}
                        </TableCell>
                        <TableCell className="py-1 text-sm text-right">{item.deducted_amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Totals — only shown in table phase */}
            {(() => {
              const needed = 30000 - grandTotal;
              return (
                <div className="border rounded overflow-hidden">
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="py-1 text-sm text-muted-foreground uppercase">0740 Total</TableCell>
                        <TableCell className="py-1 text-sm text-right">{bidder740Total.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="py-1 text-sm text-muted-foreground uppercase">Items Deducted</TableCell>
                        <TableCell className="py-1 text-sm text-right">{itemsTotal.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="py-1 text-sm text-muted-foreground uppercase">
                          {needed > 0 ? "Still Needed" : "Over By"}
                        </TableCell>
                        <TableCell className={`py-1 text-sm text-right font-medium ${needed > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                          {Math.abs(needed).toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell className="py-1 text-sm uppercase">Total</TableCell>
                        <TableCell className="py-1 text-sm text-right">
                          {grandTotal.toLocaleString()}
                          <span className="text-muted-foreground font-normal"> / 30,000</span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="py-1 text-sm text-muted-foreground uppercase">Item Price Total</TableCell>
                        <TableCell className="py-1 text-sm text-right">{itemsPriceTotal.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell className="py-1 text-sm uppercase">
                          <span className="flex items-center gap-1">
                            Net Total
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-default shrink-0" />
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[200px] text-xs">
                                  Total item price after deductions are applied.
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </span>
                        </TableCell>
                        <TableCell className="py-1 text-sm text-right">{netTotal.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      <AlertDialog
        open={boughtItemNoticeOpen}
        onOpenChange={setBoughtItemNoticeOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bought items aren't shown here</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">{excludedBoughtItemsCount}</span>{" "}
                  bought item{excludedBoughtItemsCount === 1 ? "" : "s"} in your
                  selection {excludedBoughtItemsCount === 1 ? "was" : "were"}{" "}
                  hidden from the deductions table.
                </p>
                <p>
                  Bought items aren't eligible for container tax deductions —
                  their price on the monitoring sheet comes from{" "}
                  <span className="font-mono text-xs">bought_item_price</span>,
                  which the deduction logic doesn't reduce. Editing a deduction
                  for them wouldn't have any effect on the generated workbook.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </StepShell>
  );
};
