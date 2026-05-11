"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
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
import { mergeFinalReportInventories } from "@/app/(protected)/containers/actions";
import { type FinalReportInventoryRow } from "src/entities/models/FinalReport";
import { StepShell } from "../shared/StepShell";
import { StepProps } from "../shared/types";

type ControlChoice = "UNSOLD" | "SOLD";
type SortDir = "asc" | "desc";
type UnsoldSortCol = "barcode" | "control" | "description" | "auction_date" | "status";
type SoldSortCol = "barcode" | "control" | "description" | "qty" | "price" | "auction_date";

const compareStrings = (a: string, b: string, dir: SortDir) =>
  dir === "asc" ? a.localeCompare(b) : b.localeCompare(a);
const compareNumbers = (a: number, b: number, dir: SortDir) =>
  dir === "asc" ? a - b : b - a;

export const UnsoldOverviewStep = ({
  preview,
  visibleSteps,
  goBack,
  goNext,
  goTo,
  jumpDisabled,
  loading,
  setLoading,
  refresh,
  routerRefresh,
}: StepProps) => {
  const [selectedUnsoldId, setSelectedUnsoldId] = useState<string | null>(null);
  const [selectedSoldId, setSelectedSoldId] = useState<string | null>(null);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [descFilter, setDescFilter] = useState("");
  const [unsoldSortCol, setUnsoldSortCol] = useState<UnsoldSortCol | null>(null);
  const [unsoldSortDir, setUnsoldSortDir] = useState<SortDir>("asc");
  const [soldSortCol, setSoldSortCol] = useState<SoldSortCol | null>(null);
  const [soldSortDir, setSoldSortDir] = useState<SortDir>("asc");

  const rawUnsoldItems = preview?.unsold_items ?? [];
  const rawSoldTwoPart = useMemo(
    () =>
      preview
        ? preview.report.monitoring.filter(
            (item) => item.barcode.split("-").length === 2,
          )
        : [],
    [preview?.report.monitoring], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const filterQuery = descFilter.trim().toUpperCase();

  const unsoldItems = useMemo(() => {
    let rows = filterQuery
      ? rawUnsoldItems.filter((item) =>
          item.description.toUpperCase().includes(filterQuery),
        )
      : rawUnsoldItems;
    if (unsoldSortCol) {
      const dir = unsoldSortDir;
      rows = [...rows].sort((a, b) => {
        switch (unsoldSortCol) {
          case "barcode":
            return compareStrings(a.barcode, b.barcode, dir);
          case "control":
            return compareStrings(a.control, b.control, dir);
          case "description":
            return compareStrings(a.description, b.description, dir);
          case "auction_date":
            return compareStrings(
              a.auctions_inventory?.auction_date ?? "",
              b.auctions_inventory?.auction_date ?? "",
              dir,
            );
          case "status":
            return compareStrings(
              a.auctions_inventory?.status ?? "",
              b.auctions_inventory?.status ?? "",
              dir,
            );
          default:
            return 0;
        }
      });
    }
    return rows;
  }, [rawUnsoldItems, filterQuery, unsoldSortCol, unsoldSortDir]);

  const soldTwoPart = useMemo(() => {
    let rows = filterQuery
      ? rawSoldTwoPart.filter((item) =>
          item.description.toUpperCase().includes(filterQuery),
        )
      : rawSoldTwoPart;
    if (soldSortCol) {
      const dir = soldSortDir;
      rows = [...rows].sort((a, b) => {
        switch (soldSortCol) {
          case "barcode":
            return compareStrings(a.barcode, b.barcode, dir);
          case "control":
            return compareStrings(a.control, b.control, dir);
          case "description":
            return compareStrings(a.description, b.description, dir);
          case "qty":
            return compareNumbers(Number(a.qty) || 0, Number(b.qty) || 0, dir);
          case "price":
            return compareNumbers(a.price, b.price, dir);
          case "auction_date":
            return compareStrings(a.auction_date, b.auction_date, dir);
          default:
            return 0;
        }
      });
    }
    return rows;
  }, [rawSoldTwoPart, filterQuery, soldSortCol, soldSortDir]);

  const cycleUnsoldSort = (col: UnsoldSortCol) => {
    if (unsoldSortCol !== col) {
      setUnsoldSortCol(col);
      setUnsoldSortDir("asc");
    } else if (unsoldSortDir === "asc") {
      setUnsoldSortDir("desc");
    } else {
      setUnsoldSortCol(null);
      setUnsoldSortDir("asc");
    }
  };
  const cycleSoldSort = (col: SoldSortCol) => {
    if (soldSortCol !== col) {
      setSoldSortCol(col);
      setSoldSortDir("asc");
    } else if (soldSortDir === "asc") {
      setSoldSortDir("desc");
    } else {
      setSoldSortCol(null);
      setSoldSortDir("asc");
    }
  };
  const UnsoldSortIcon = ({ col }: { col: UnsoldSortCol }) => {
    if (unsoldSortCol !== col)
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return unsoldSortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    );
  };
  const SoldSortIcon = ({ col }: { col: SoldSortCol }) => {
    if (soldSortCol !== col)
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return soldSortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    );
  };

  if (!preview) return null;

  const selectedUnsold = unsoldItems.find(
    (item) => item.inventory_id === selectedUnsoldId,
  ) ?? null;
  const selectedSold = soldTwoPart.find(
    (item) => item.inventory_id === selectedSoldId,
  ) ?? null;

  const canMerge = selectedUnsold !== null && selectedSold !== null;

  const needsControlPrompt =
    selectedUnsold !== null &&
    selectedUnsold.control !== "0000" &&
    selectedUnsold.control !== "00NC";

  const isMergeEligible = (item: FinalReportInventoryRow) => {
    const status = item.auctions_inventory?.status;
    return status !== "CANCELLED" && status !== "REFUNDED";
  };

  const handleMergeClick = () => {
    if (!canMerge) return;
    if (needsControlPrompt) {
      setConflictOpen(true);
    } else {
      void doMerge(undefined);
    }
  };

  const doMerge = async (control_choice: ControlChoice | undefined) => {
    if (!selectedUnsold || !selectedSold) return;
    setConflictOpen(false);
    setLoading("Merging items...");
    try {
      const res = await mergeFinalReportInventories({
        old_inventory_id: selectedSold.inventory_id,
        new_inventory_id: selectedUnsold.inventory_id,
        control_choice,
      });
      if (!res.ok) {
        toast.error(res.error.message, {
          description:
            typeof res.error.cause === "string" ? res.error.cause : undefined,
        });
        return;
      }
      toast.success("Items merged.");
      setSelectedUnsoldId(null);
      setSelectedSoldId(null);
      await refresh();
      routerRefresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <StepShell
        step="unsold-overview"
        visibleSteps={visibleSteps}
        onBack={goBack}
        onJumpTo={goTo}
        jumpDisabled={jumpDisabled}
        onNext={goNext}
        nextLabel="Continue"
        loading={loading}
        description="Review UNSOLD and SOLD items. Select one from each side to merge them — the UNSOLD item inherits the SOLD item's auction record."
      >
        <div className="mb-3">
          <Input
            placeholder="Filter both tables by description…"
            value={descFilter}
            onChange={(event) => setDescFilter(event.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 min-w-0">
          {/* UNSOLD */}
          <div className="min-w-0 flex flex-col gap-2">
            <p className="text-sm font-medium">
              UNSOLD{" "}
              <span className="text-muted-foreground font-normal">
                ({unsoldItems.length}
                {unsoldItems.length !== rawUnsoldItems.length
                  ? ` of ${rawUnsoldItems.length}`
                  : ""}
                )
              </span>
            </p>
            <div className="border rounded overflow-auto max-h-[440px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => cycleUnsoldSort("barcode")}
                    >
                      Barcode <UnsoldSortIcon col="barcode" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => cycleUnsoldSort("control")}
                    >
                      Ctrl <UnsoldSortIcon col="control" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => cycleUnsoldSort("description")}
                    >
                      Description <UnsoldSortIcon col="description" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => cycleUnsoldSort("auction_date")}
                    >
                      Auction Date <UnsoldSortIcon col="auction_date" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => cycleUnsoldSort("status")}
                    >
                      Status <UnsoldSortIcon col="status" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unsoldItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-sm text-muted-foreground">
                        No UNSOLD items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    unsoldItems.map((item) => {
                      const auctionStatus = item.auctions_inventory?.status ?? null;
                      const reason = item.auctions_inventory?.reason ?? null;
                      const isBad =
                        auctionStatus === "CANCELLED" || auctionStatus === "REFUNDED";
                      const eligible = isMergeEligible(item);
                      const selected = item.inventory_id === selectedUnsoldId;

                      return (
                        <TableRow
                          key={item.inventory_id}
                          onClick={() => {
                            if (!eligible) return;
                            setSelectedUnsoldId(
                              selected ? null : item.inventory_id,
                            );
                          }}
                          className={
                            !eligible
                              ? "opacity-50"
                              : selected
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
                          <TableCell className="text-xs whitespace-nowrap">
                            {item.auctions_inventory?.auction_date ?? "—"}
                          </TableCell>
                          <TableCell>
                            {auctionStatus ? (
                              <div className="flex items-center gap-1 text-xs min-w-0">
                                <span
                                  className={
                                    isBad
                                      ? "font-medium text-destructive shrink-0"
                                      : "text-muted-foreground shrink-0"
                                  }
                                >
                                  {auctionStatus}
                                </span>
                                {isBad && reason ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="truncate cursor-help text-destructive max-w-[80px]">
                                        — {reason}
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs">
                                      {reason}
                                    </TooltipContent>
                                  </Tooltip>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* SOLD */}
          <div className="min-w-0 flex flex-col gap-2">
            <p className="text-sm font-medium">
              SOLD — 2-part{" "}
              <span className="text-muted-foreground font-normal">
                ({soldTwoPart.length}
                {soldTwoPart.length !== rawSoldTwoPart.length
                  ? ` of ${rawSoldTwoPart.length}`
                  : ""}
                )
              </span>
            </p>
            <div className="border rounded overflow-auto max-h-[440px]">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => cycleSoldSort("barcode")}
                    >
                      Barcode <SoldSortIcon col="barcode" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => cycleSoldSort("control")}
                    >
                      Ctrl <SoldSortIcon col="control" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => cycleSoldSort("description")}
                    >
                      Description <SoldSortIcon col="description" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => cycleSoldSort("qty")}
                    >
                      Qty <SoldSortIcon col="qty" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => cycleSoldSort("price")}
                    >
                      Price <SoldSortIcon col="price" />
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={() => cycleSoldSort("auction_date")}
                    >
                      Auction Date <SoldSortIcon col="auction_date" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {soldTwoPart.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-sm text-muted-foreground">
                        No sold two-part items.
                      </TableCell>
                    </TableRow>
                  ) : (
                    soldTwoPart.map((item) => {
                      const selected = item.inventory_id === selectedSoldId;
                      return (
                        <TableRow
                          key={item.auction_inventory_id}
                          onClick={() =>
                            setSelectedSoldId(
                              selected ? null : item.inventory_id,
                            )
                          }
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
                          <TableCell className="text-xs">{item.qty}</TableCell>
                          <TableCell className="text-xs">
                            {item.price.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {item.auction_date}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Merge action bar */}
        {canMerge ? (
          <div className="mt-3 flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-muted-foreground shrink-0">Merge:</span>
              <span className="font-mono font-medium truncate">
                {selectedUnsold!.barcode}
              </span>
              <span className="text-muted-foreground shrink-0">←</span>
              <span className="font-mono font-medium truncate">
                {selectedSold!.barcode}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setSelectedUnsoldId(null);
                  setSelectedSoldId(null);
                }}
              >
                Clear
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleMergeClick}
                disabled={Boolean(loading)}
              >
                Merge
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">
            Click a row on each side to select items to merge. CANCELLED and REFUNDED items cannot be merged.
          </p>
        )}
      </StepShell>

      {/* Control conflict dialog */}
      <Dialog open={conflictOpen} onOpenChange={setConflictOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Choose Control Number</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Both items have different control numbers. Which one should be used?
          </p>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="rounded border p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">UNSOLD item</p>
              <p className="font-mono font-medium">{selectedUnsold?.control}</p>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {selectedUnsold?.barcode}
              </p>
            </div>
            <div className="rounded border p-3 text-sm">
              <p className="text-xs text-muted-foreground mb-1">SOLD item</p>
              <p className="font-mono font-medium">{selectedSold?.control}</p>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {selectedSold?.barcode}
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => doMerge("UNSOLD")}
              disabled={Boolean(loading)}
            >
              Use UNSOLD ({selectedUnsold?.control})
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => doMerge("SOLD")}
              disabled={Boolean(loading)}
            >
              Use SOLD ({selectedSold?.control})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
