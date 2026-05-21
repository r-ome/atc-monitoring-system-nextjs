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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { StepShell } from "../shared/StepShell";
import { StepProps } from "../shared/types";

type SortCol = "control" | "description" | "price" | "newPrice";
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
  // Local New Price input state, keyed by auction_inventory_id (one per monitoring row).
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

  // Monitoring rows for confirmed descriptions, excluding 0740 (handled separately).
  const confirmedRows = useMemo(() => {
    if (!preview || confirmedDescs === null) return [];
    return preview.report.monitoring.filter(
      (row) =>
        confirmedDescs.has(row.description) &&
        row.bidder_number !== "0740",
    );
  }, [preview, confirmedDescs]); // eslint-disable-line react-hooks/exhaustive-deps

  const tableRows = useMemo(
    () =>
      confirmedRows.map((row) => {
        const key = `${row.control}|${row.bidder_number}|${row.description}`;
        const defaultDeduction = deductionMap.get(key) ?? 0;
        // Persisted edit from the draft takes precedence over the server's default.
        // Local in-progress edits are stored as New Price and converted back to
        // deducted_amount below for draft/report compatibility.
        const persistedEdit = draftEditsByBarcodeControl.get(
          `${row.barcode}|${row.control}`,
        );
        const savedDeduction = persistedEdit ?? defaultDeduction;
        const edited = edits[row.auction_inventory_id];
        // The monitoring sheet uses bought_item_price for bought items, row.price
        // for everything else. The server preview has already subtracted any
        // saved tax deduction, so reconstruct the original pre-deduction price
        // by adding the saved deduction back before displaying/editing.
        const sheet_price =
          row.was_bought_item && row.bought_item_price != null
            ? row.bought_item_price
            : row.price;
        const gross_price = sheet_price + savedDeduction;
        const minNewPrice = Math.min(100, gross_price);
        const maxNewPrice = gross_price;
        const savedNewPrice = gross_price - savedDeduction;
        const rawNewPrice =
          edited !== undefined
            ? edited.trim() === ""
              ? maxNewPrice
              : Number.isFinite(Number(edited))
                ? Number(edited)
                : maxNewPrice
            : savedNewPrice;
        const new_price = Math.min(Math.max(rawNewPrice, minNewPrice), maxNewPrice);
        const deducted_amount = Math.max(0, gross_price - new_price);
        return { ...row, deducted_amount, original_price: gross_price, new_price };
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
        else { av = a.new_price; bv = b.new_price; }

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
  // row.original_price is the gross (pre-deduction) price. New Price is what
  // the monitoring sheet's price column will show after deductions are applied.
  const itemsPriceTotal = tableRows.reduce((acc, row) => acc + row.original_price, 0);
  const netTotal = tableRows.reduce((acc, row) => acc + row.new_price, 0);

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
        // Preserve previously-saved tax_edits if the user never engaged with
        // the table in this session. Once confirmed, the table reflects the
        // intended state, including intentionally clearing all deductions.
        const newEdits = taxEditsForDraft();
        const userEngaged = confirmedDescs !== null;
        if (userEngaged) {
          await saveDraft({ ...state.draft, tax_edits: newEdits });
        }
        goNext();
      }}
      nextLabel="Save & Continue"
      loading={loading}
      description={
        showFilter
          ? "Select which item descriptions should have their price deducted, then confirm."
          : "New prices assumed per monitoring row for the generated report."
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
                    <TableHead className="cursor-pointer select-none whitespace-nowrap" onClick={() => cycleSort("newPrice")}>
                      New Price <SortIcon col="newPrice" />
                    </TableHead>
                    <TableHead className="whitespace-nowrap">Deducted</TableHead>
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
                            min={Math.min(100, row.original_price)}
                            max={row.original_price}
                            className="w-20 h-6 px-2 text-xs border rounded-md focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none bg-transparent"
                            value={
                              edits[row.auction_inventory_id] !== undefined
                                ? edits[row.auction_inventory_id]
                                : String(row.new_price)
                            }
                            onChange={(e) => {
                              setEdits((prev) => ({
                                ...prev,
                                [row.auction_inventory_id]: e.target.value,
                              }));
                            }}
                            onBlur={(e) => {
                              const raw = e.target.value;
                              const minNewPrice = Math.min(100, row.original_price);
                              const num = Number(raw);
                              const normalized =
                                raw.trim() === "" || !Number.isFinite(num)
                                  ? row.original_price
                                  : Math.min(Math.max(num, minNewPrice), row.original_price);
                              setEdits((prev) => ({
                                ...prev,
                                [row.auction_inventory_id]: String(normalized),
                              }));
                            }}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                          />
                        </TableCell>
                        <TableCell className="py-1 text-xs">
                          {row.deducted_amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Totals panel */}
          <div className="w-[340px] shrink-0 flex flex-col gap-3 border rounded p-3 self-start">
            <p className="text-sm font-medium uppercase tracking-wide">Totals</p>

            {/* Totals — only shown in table phase */}
            {(() => {
              const needed = 30000 - grandTotal;
              return (
                <div className="border rounded overflow-hidden">
                  <Table className="table-fixed">
                    <TableBody>
                      <TableRow>
                        <TableCell className="w-[52%] py-1 text-sm text-muted-foreground uppercase">0740 Total</TableCell>
                        <TableCell className="w-[48%] py-1 text-sm text-right tabular-nums whitespace-nowrap">{bidder740Total.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="py-1 text-sm text-muted-foreground uppercase">Items Deducted</TableCell>
                        <TableCell className="py-1 text-sm text-right tabular-nums whitespace-nowrap">{itemsTotal.toLocaleString()}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="py-1 text-sm text-muted-foreground uppercase">
                          {needed > 0 ? "Still Needed" : "Over By"}
                        </TableCell>
                        <TableCell className={`py-1 text-sm text-right font-medium tabular-nums whitespace-nowrap ${needed > 0 ? "text-destructive" : "text-green-600 dark:text-green-400"}`}>
                          {Math.abs(needed).toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow className="font-medium">
                        <TableCell className="py-1 text-sm uppercase">Total</TableCell>
                        <TableCell className="py-1 text-sm text-right tabular-nums whitespace-nowrap">
                          {grandTotal.toLocaleString()}
                          <span className="text-muted-foreground font-normal"> / 30,000</span>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="py-1 text-sm text-muted-foreground uppercase">Item Price Total</TableCell>
                        <TableCell className="py-1 text-sm text-right tabular-nums whitespace-nowrap">{itemsPriceTotal.toLocaleString()}</TableCell>
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
                        <TableCell className="py-1 text-sm text-right tabular-nums whitespace-nowrap">{netTotal.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              );
            })()}

          </div>
        </div>
      )}

    </StepShell>
  );
};
