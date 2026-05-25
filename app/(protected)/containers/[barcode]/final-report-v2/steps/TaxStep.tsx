"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { flushSync } from "react-dom";
import { AlertCircle, Check, Search, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { cn } from "@/app/lib/utils";
import { StepHeading } from "../shared/StepHeading";
import { peso } from "../shared/format";
import type { V2StepProps } from "../shared/types";

const TAX_TARGET = 30000;

export const TaxStep = (props: V2StepProps) => {
  if (!props.preview) {
    return <div className="p-7 text-sm text-muted-foreground">Loading…</div>;
  }
  return <TaxStepBody {...props} preview={props.preview} />;
};

type TaxBodyProps = V2StepProps & {
  preview: NonNullable<V2StepProps["preview"]>;
};

const TaxStepBody = ({
  preview,
  state,
  saveDraft,
  refresh,
  registerBeforeLeave,
}: TaxBodyProps) => {
  const monitoring = preview.report.monitoring;

  // Description list — distinct, alphabetized, derived from this container.
  const allDescs = useMemo(
    () =>
      Array.from(new Set(monitoring.map((m) => m.description))).sort(),
    [monitoring],
  );

  const serverDeductionDescs = useMemo(
    () => new Set(preview.report.deductions.map((d) => d.description)),
    [preview.report.deductions],
  );

  const draftEditByKey = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of state.draft.tax_edits) {
      m.set(`${e.barcode}|${e.control}`, e.deducted_amount);
    }
    return m;
  }, [state.draft.tax_edits]);

  const draftDeductionDescs = useMemo(() => {
    const out = new Set<string>();
    for (const row of monitoring) {
      if (draftEditByKey.has(`${row.barcode}|${row.control}`)) {
        out.add(row.description);
      }
    }
    return out;
  }, [monitoring, draftEditByKey]);

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set([...serverDeductionDescs, ...draftDeductionDescs]),
  );

  // Re-seed once when preview key changes
  const previewKey = monitoring
    .map((m) => m.auction_inventory_id)
    .join("::");
  useEffect(() => {
    setSelected(new Set([...serverDeductionDescs, ...draftDeductionDescs]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const [descSearch, setDescSearch] = useState("");
  const [tableSearch, setTableSearch] = useState("");

  // Editable New Price by auction_inventory_id (in-progress local state).
  const [edits, setEdits] = useState<Record<string, string>>({});

  // Keep the visible row order in a ref so arrow-key navigation has a stable
  // callback (won't break input memoization on every render).
  const visibleOrderRef = useRef<string[]>([]);
  const focusSibling = useCallback(
    (rowId: string, dir: "up" | "down") => {
      const order = visibleOrderRef.current;
      const idx = order.indexOf(rowId);
      if (idx < 0) return;
      const nextId = order[idx + (dir === "up" ? -1 : 1)];
      if (!nextId) return;
      const el = document.querySelector<HTMLInputElement>(
        `input[data-row-id="${CSS.escape(nextId)}"]`,
      );
      if (el) {
        el.focus();
        el.select();
      }
    },
    [],
  );

  const filteredDescs = useMemo(() => {
    const q = descSearch.trim().toUpperCase();
    return q
      ? allDescs.filter((d) => d.toUpperCase().includes(q))
      : allDescs;
  }, [allDescs, descSearch]);

  // Bidder 0740 pre-counted toward the target
  const bidder0740Total = useMemo(
    () =>
      preview.report.deductions
        .filter((d) => d.bidder_number === "0740")
        .reduce((sum, d) => sum + d.deducted_amount, 0),
    [preview.report.deductions],
  );

  const deductionMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of preview.report.deductions) {
      m.set(`${d.control}|${d.bidder_number}|${d.description}`, d.deducted_amount);
    }
    return m;
  }, [preview.report.deductions]);

  const tableRows = useMemo(() => {
    return monitoring
      .filter(
        (row) =>
          selected.has(row.description) && row.bidder_number !== "0740",
      )
      .map((row) => {
        // Server-side deduction reflected in the preview. This is stable —
        // it only changes when the preview is refreshed.
        const key = `${row.control}|${row.bidder_number}|${row.description}`;
        const serverDeduction = deductionMap.get(key) ?? 0;
        // Local draft edit (may be different from serverDeduction while the
        // user is typing, before the next preview refresh).
        const persistedEdit = draftEditByKey.get(
          `${row.barcode}|${row.control}`,
        );
        const sheetPrice =
          row.was_bought_item && row.bought_item_price != null
            ? row.bought_item_price
            : row.price;
        // Reconstruct the pre-deduction gross using the SERVER's reflection
        // only — never the local draft. Otherwise grossPrice would jump every
        // time we autosave, creating a render loop.
        const grossPrice = sheetPrice + serverDeduction;
        const minNewPrice = Math.min(100, grossPrice);
        const maxNewPrice = grossPrice;
        // Display source of truth: local edit wins; otherwise show the
        // currently-saved draft value; otherwise show the server's reflection.
        const seedDeduction = persistedEdit ?? serverDeduction;
        const savedNewPrice = grossPrice - seedDeduction;
        const editVal = edits[row.auction_inventory_id];
        const rawNew =
          editVal !== undefined
            ? editVal.trim() === ""
              ? maxNewPrice
              : Number.isFinite(Number(editVal))
                ? Number(editVal)
                : maxNewPrice
            : savedNewPrice;
        const new_price = Math.min(
          Math.max(rawNew, minNewPrice),
          maxNewPrice,
        );
        const deducted = Math.max(0, grossPrice - new_price);
        const isInvalid =
          editVal !== undefined &&
          Number.isFinite(Number(editVal)) &&
          Number(editVal) > grossPrice;
        return { ...row, grossPrice, new_price, deducted, isInvalid };
      });
  }, [monitoring, selected, deductionMap, draftEditByKey, edits]);

  const visibleTableRows = useMemo(() => {
    const q = tableSearch.trim().toUpperCase();
    if (!q) return tableRows;
    return tableRows.filter(
      (r) =>
        r.control.toUpperCase().includes(q) ||
        r.description.toUpperCase().includes(q) ||
        String(r.grossPrice).includes(q),
    );
  }, [tableRows, tableSearch]);
  visibleOrderRef.current = visibleTableRows.map(
    (r) => r.auction_inventory_id,
  );

  const itemsDeducted = tableRows.reduce((sum, r) => sum + r.deducted, 0);
  const totalApplied = bidder0740Total + itemsDeducted;
  const itemPriceTotal = monitoring.reduce((sum, m) => {
    const p = m.was_bought_item && m.bought_item_price != null
      ? m.bought_item_price
      : m.price;
    return sum + p;
  }, 0);
  const netTotal = itemPriceTotal - itemsDeducted;
  const targetRemaining = Math.max(0, TAX_TARGET - totalApplied);
  const isMet = targetRemaining === 0;
  const hasInvalid = tableRows.some((r) => r.isInvalid);

  const allFilteredChecked =
    filteredDescs.length > 0 && filteredDescs.every((d) => selected.has(d));

  const toggleDesc = (d: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });

  const toggleAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredChecked) filteredDescs.forEach((d) => next.delete(d));
      else filteredDescs.forEach((d) => next.add(d));
      return next;
    });

  // Clearing has to also override draft-backed deductions, not just the local
  // edits map. For every row that currently shows a deduction (whether from
  // the saved draft or from in-progress typing), set its local edit to the
  // full grossPrice so tableRows recomputes deducted = 0 and the next
  // beforeLeave persists an empty tax_edits.
  const clearDeductions = () => {
    setEdits((prev) => {
      const next = { ...prev };
      for (const row of tableRows) {
        if (row.deducted > 0) {
          next[row.auction_inventory_id] = String(row.grossPrice);
        }
      }
      return next;
    });
  };
  const hasAnyDeduction = tableRows.some((r) => r.deducted > 0);

  // Pending tax_edits — computed from the current table state. Re-derived on
  // every render and held in a ref so registerBeforeLeave can flush exactly
  // once when the user navigates away.
  const pendingEditsRef = useRef<
    { barcode: string; control: string; deducted_amount: number }[]
  >([]);
  pendingEditsRef.current = tableRows
    .filter((r) => r.deducted > 0)
    .map((r) => ({
      barcode: r.barcode,
      control: r.control,
      deducted_amount: r.deducted,
    }));

  // Snapshot the latest draft so the commit closure doesn't go stale.
  const draftRef = useRef(state.draft);
  draftRef.current = state.draft;

  useEffect(() => {
    registerBeforeLeave(async () => {
      const next = pendingEditsRef.current;
      const prev = draftRef.current.tax_edits;
      if (JSON.stringify(prev) === JSON.stringify(next)) return;
      await saveDraft({ ...draftRef.current, tax_edits: next });
      // The server preview applies tax_edits to monitoring + deductions.
      // Without refreshing, Step 5/6 would render the pre-save preview,
      // hiding the deductions the user just committed. Throwing on a null
      // refresh propagates through flushBeforeLeave → navigation aborts so
      // the user stays on the Tax step instead of moving on with stale
      // preview data.
      const fresh = await refresh();
      if (!fresh) {
        throw new Error(
          "Couldn't refresh the preview after saving tax deductions.",
        );
      }
    });
    return () => registerBeforeLeave(null);
  }, [registerBeforeLeave, saveDraft, refresh]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left — description filter */}
      <aside className="flex w-[260px] shrink-0 flex-col border-r bg-background">
        <div className="border-b px-4 pb-2.5 pt-3.5">
          <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Filter by description
          </div>
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={descSearch}
              onChange={(e) => setDescSearch(e.target.value)}
              placeholder="Search descriptions…"
              className="h-8 pl-7 text-[13px]"
            />
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 border-b px-4 py-2.5 text-[12.5px] font-semibold">
          <Checkbox
            checked={allFilteredChecked}
            onCheckedChange={toggleAllFiltered}
          />
          <span>{allFilteredChecked ? "Deselect all" : "Select all"}</span>
          <span className="ml-auto text-[11.5px] font-medium text-muted-foreground">
            {selected.size}/{allDescs.length}
          </span>
        </label>
        <div className="flex-1 overflow-auto py-1">
          {filteredDescs.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-muted-foreground">
              No descriptions match.
            </div>
          ) : (
            filteredDescs.map((d) => {
              const on = selected.has(d);
              return (
                <label
                  key={d}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-4 py-1.5 text-[12.5px]",
                    on ? "bg-primary/10 text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Checkbox checked={on} onCheckedChange={() => toggleDesc(d)} />
                  <span className="truncate">{d}</span>
                </label>
              );
            })
          )}
        </div>
      </aside>

      {/* Center — heading + table */}
      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        <div className="px-7 pb-3.5 pt-7">
          <StepHeading
            n={3}
            title="Apply the container tax deduction"
            sub={`We need to reduce ${peso(TAX_TARGET)} from this container for tax purposes. Pick descriptions on the left, then lower prices below until the target is met.`}
          />
        </div>

        <div className="flex items-center justify-between gap-3.5 px-7 pb-3.5">
          <div className="relative w-full max-w-[360px]">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search control, description, or price…"
              className="h-8 pl-7 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-3.5">
            <span className="text-[12px] text-muted-foreground">
              {visibleTableRows.length} of {tableRows.length} items shown
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasAnyDeduction}
              onClick={clearDeductions}
            >
              <X size={12} /> Clear deductions
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-7 pb-7">
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Ctrl</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[80px]">Bidder</TableHead>
                  <TableHead className="w-[90px] text-right">Price</TableHead>
                  <TableHead className="w-[130px] text-right">
                    New Price
                  </TableHead>
                  <TableHead className="w-[100px] text-right">
                    Deducted
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTableRows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-9 text-center italic text-muted-foreground"
                    >
                      {selected.size === 0
                        ? "Pick at least one description in the sidebar to see items here."
                        : "No items match your search."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleTableRows.map((row) => (
                    <TableRow
                      key={row.auction_inventory_id}
                      className={
                        row.deducted > 0
                          ? "bg-emerald-50/50 dark:bg-emerald-950/15"
                          : ""
                      }
                    >
                      <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                        {row.control}
                      </TableCell>
                      <TableCell className="text-[13px] font-medium">
                        {row.description}
                      </TableCell>
                      <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                        {row.bidder_number}
                      </TableCell>
                      <TableCell className="text-right font-mono text-[12.5px]">
                        {row.grossPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-1.5">
                        <div className="flex justify-end">
                          <NewPriceInput
                            rowId={row.auction_inventory_id}
                            initialValue={
                              edits[row.auction_inventory_id] !== undefined
                                ? edits[row.auction_inventory_id]
                                : String(row.new_price)
                            }
                            maxValue={row.grossPrice}
                            isInvalid={row.isInvalid}
                            onCommit={(value) =>
                              setEdits((prev) => ({
                                ...prev,
                                [row.auction_inventory_id]: value,
                              }))
                            }
                            onNavigate={focusSibling}
                          />
                        </div>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right font-mono text-[12.5px]",
                          row.deducted > 0
                            ? "font-semibold text-emerald-700 dark:text-emerald-400"
                            : "text-muted-foreground",
                        )}
                      >
                        {row.deducted > 0
                          ? `−${row.deducted.toLocaleString()}`
                          : "0"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
          {hasInvalid ? (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-destructive/10 px-3.5 py-2.5 text-[12.5px] font-medium text-destructive">
              <AlertCircle size={14} /> New price can&apos;t be higher than the
              original. Lower or reset the highlighted rows.
            </div>
          ) : null}
        </div>
      </div>

      {/* Right — totals */}
      <aside className="flex w-[280px] shrink-0 flex-col border-l bg-background">
        <div className="border-b px-4 py-3.5 text-[11.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Totals
        </div>
        <div className="border-b px-4 py-[18px]">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
            Container tax target
          </div>
          <div className="mt-1.5 font-mono text-[24px] font-bold tracking-[-0.02em]">
            {peso(totalApplied)}
            <span className="ml-1.5 text-[13px] font-medium text-muted-foreground">
              / {peso(TAX_TARGET)}
            </span>
          </div>
          <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full transition-all",
                isMet ? "bg-emerald-500" : "bg-primary",
              )}
              style={{
                width: `${Math.min(100, (totalApplied / TAX_TARGET) * 100)}%`,
              }}
            />
          </div>
          {isMet ? (
            <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600">
              <Check size={12} /> Target met
            </div>
          ) : (
            <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-destructive">
              <AlertCircle size={12} /> Still needed{" "}
              <span className="ml-auto font-mono">{peso(targetRemaining)}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col px-4 py-3.5 text-[12.5px]">
          <TotalRow
            label="Bidder 0740"
            sub="Pre-counted toward target"
            value={peso(bidder0740Total)}
          />
          <TotalRow
            label="Items deducted"
            sub="Sum of all price reductions"
            value={
              itemsDeducted > 0 ? `−${peso(itemsDeducted)}` : peso(0)
            }
            tone={itemsDeducted > 0 ? "success" : "neutral"}
          />
          <div className="my-2.5 h-px bg-border" />
          <TotalRow
            label="Item price total"
            sub="Original auction prices"
            value={peso(itemPriceTotal)}
          />
          <TotalRow
            label="Net total"
            sub="After deductions"
            value={peso(netTotal)}
            tone="strong"
          />
        </div>
      </aside>
    </div>
  );
};

// Isolates per-row input state so typing only re-renders this one input
// instead of the whole table. Commits the value upward on debounce or blur.
type NewPriceInputProps = {
  rowId: string;
  initialValue: string;
  maxValue: number;
  isInvalid: boolean;
  onCommit: (value: string) => void;
  onNavigate?: (rowId: string, dir: "up" | "down") => void;
};

const NewPriceInputBase = ({
  rowId,
  initialValue,
  maxValue,
  isInvalid,
  onCommit,
  onNavigate,
}: NewPriceInputProps) => {
  const [local, setLocal] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const lastInitialRef = useRef(initialValue);
  useEffect(() => {
    if (lastInitialRef.current === initialValue) return;
    lastInitialRef.current = initialValue;
    if (document.activeElement !== inputRef.current) {
      setLocal(initialValue);
    }
  }, [initialValue]);

  const commit = () => {
    if (local === initialValue) return;
    // flushSync so the parent's edits state is applied before the click that
    // caused this blur (e.g. step rail / footer Next) reads pendingEditsRef.
    flushSync(() => onCommit(local));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "Enter") {
      return;
    }
    e.preventDefault();
    commit();
    onNavigate?.(rowId, e.key === "ArrowUp" ? "up" : "down");
  };

  return (
    <div
      className={cn(
        "flex h-7 w-[110px] items-center gap-1 rounded-md border bg-background px-2",
        isInvalid && "border-destructive",
      )}
    >
      <span className="text-[11px] text-muted-foreground">₱</span>
      <input
        ref={inputRef}
        type="number"
        max={maxValue}
        min={0}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full bg-transparent text-right font-mono text-[12.5px] outline-none",
          isInvalid && "text-destructive",
        )}
        data-row-id={rowId}
      />
    </div>
  );
};

const NewPriceInput = memo(NewPriceInputBase);

const TotalRow = ({
  label,
  sub,
  value,
  tone = "neutral",
}: {
  label: string;
  sub: string;
  value: string;
  tone?: "neutral" | "success" | "strong";
}) => (
  <div className="flex items-start justify-between gap-2.5 py-[7px]">
    <div className="min-w-0">
      <div className="text-[11.5px] font-semibold uppercase tracking-[0.04em] text-foreground/80">
        {label}
      </div>
      <div className="mt-px text-[11px] text-muted-foreground">{sub}</div>
    </div>
    <div
      className={cn(
        "whitespace-nowrap font-mono",
        tone === "success" && "text-emerald-600",
        tone === "strong" ? "text-[14px] font-bold tracking-[-0.01em]" : "text-[13px] font-semibold",
      )}
    >
      {value}
    </div>
  </div>
);
