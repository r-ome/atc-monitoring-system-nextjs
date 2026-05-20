"use client";

import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { formatNumberPadding } from "@/app/lib/utils";
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
  if (!preview) return null;

  const appendable = preview.appendable_unsold_items;
  const containerBarcode = preview.sheet_details.barcode;
  const appendableIds = useMemo(
    () => new Set(appendable.map((item) => item.inventory_id)),
    [appendable],
  );

  const order = state.draft.appended_inventory_ids;
  const orderIndex = useMemo(() => {
    const m = new Map<string, number>();
    order.forEach((id, i) => m.set(id, i));
    return m;
  }, [order]);

  const saveAppendOrder = async (nextOrder: string[], message: string) => {
    setLoading("Staging append...");
    try {
      await saveDraft({
        ...state.draft,
        bought_items: state.draft.bought_items.filter(
          (item) => !appendableIds.has(item.inventory_id),
        ),
        appended_inventory_ids: nextOrder,
      });
      toast.success(message);
      await refresh();
    } finally {
      setLoading(null);
    }
  };

  const handleStage = (inventoryId: string) => {
    if (order.includes(inventoryId)) return;
    void saveAppendOrder([...order, inventoryId], "Row staged for report append.");
  };

  const handleRemove = async (inventoryId: string) => {
    await saveAppendOrder(
      order.filter((id) => id !== inventoryId),
      "Report append removed.",
    );
  };

  const handleStageAll = () => {
    const nextOrder = [
      ...order.filter((id) => appendableIds.has(id)),
      ...appendable
        .map((item) => item.inventory_id)
        .filter((id) => !order.includes(id)),
    ];
    void saveAppendOrder(nextOrder, "All SOLD two-part rows staged for report append.");
  };

  const allStaged =
    appendable.length > 0 &&
    appendable.every((item) => orderIndex.has(item.inventory_id));

  const baseSuffix = preview.next_append_suffix;
  const previewBarcodeFor = (inventoryId: string) => {
    const idx = orderIndex.get(inventoryId);
    if (idx === undefined) return null;
    return `${containerBarcode}-${formatNumberPadding(baseSuffix + idx, 3)}`;
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
      description={`SOLD two-part rows will be rewritten with virtual three-part barcodes (starting at ${containerBarcode}-${baseSuffix}) on both the monitoring sheet and the ENCODE inventory list. This is report-only; the underlying inventory barcode stays unchanged.`}
    >
      <div className="grid grid-cols-[1fr_280px] gap-4 min-w-0">
        {/* Left: appendable list */}
        <div className="min-w-0 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              SOLD two-part{" "}
              <span className="text-muted-foreground font-normal">
                ({appendable.length})
              </span>
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handleStageAll}
              disabled={Boolean(loading) || appendable.length === 0 || allStaged}
            >
              Stage All
            </Button>
          </div>
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
                      No SOLD two-part rows.
                    </TableCell>
                  </TableRow>
                ) : (
                  appendable.map((item) => {
                    const staged = orderIndex.has(item.inventory_id);
                    const newBarcode = previewBarcodeFor(item.inventory_id);
                    return (
                      <TableRow
                        key={item.inventory_id}
                        onClick={() => handleStage(item.inventory_id)}
                        className={
                          staged
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

        <div className="min-w-0 flex flex-col gap-3 rounded border bg-muted/30 p-3 self-start text-sm">
          <p className="font-medium">Report-only append</p>
          <p className="text-xs text-muted-foreground">
            These rows are already SOLD as two-part barcodes. Staging them rewrites
            them with virtual three-part barcodes on both the monitoring sheet and
            the ENCODE inventory list.
          </p>
          <div className="text-xs">
            <span className="text-muted-foreground">Staged: </span>
            <span className="font-medium">
              {appendable.filter((item) => orderIndex.has(item.inventory_id)).length}
              {" / "}
              {appendable.length}
            </span>
          </div>
        </div>
      </div>
    </StepShell>
  );
};
