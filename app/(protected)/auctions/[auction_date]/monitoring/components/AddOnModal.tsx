"use client";

import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  previewAddOn,
  confirmAddOn,
} from "@/app/(protected)/auctions/actions";
import { Button } from "@/app/components/ui/button";
import { SelectWithSearch } from "@/app/components/ui/SelectWithSearch";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { RegisteredBidder } from "src/entities/models/Bidder";
import {
  type ManifestSheetRecord,
  type UploadManifestInput,
} from "src/entities/models/Manifest";
import { ManifestPreviewTable } from "./ManifestPreviewTable";

interface AddOnModalProps {
  auction_id: string;
  registered_bidders: RegisteredBidder[];
}

type AddOnDraftRow = ManifestSheetRecord & { id: string };

const createDraftRow = (id: number): AddOnDraftRow => ({
  id: `add-on-${id}`,
  BARCODE: "",
  CONTROL: "",
  DESCRIPTION: "",
  BIDDER: "",
  PRICE: "",
  QTY: "",
  MANIFEST: "ADD ON",
});

const DRAFT_FIELD_COUNT = 6;

export const AddOnModal: React.FC<AddOnModalProps> = ({
  auction_id,
  registered_bidders,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [draftRows, setDraftRows] = useState<AddOnDraftRow[]>([
    createDraftRow(1),
  ]);
  const [nextRowId, setNextRowId] = useState(2);
  const [previewData, setPreviewData] = useState<UploadManifestInput[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] =
    useState<ManifestSheetRecord | null>(null);

  const isLoading = loadingMessage !== null;
  const step = previewData.length > 0 ? "preview" : "upload";
  const validPreviewRows = useMemo(
    () => previewData.filter((row) => row.isValid),
    [previewData],
  );
  const bidderOptions = useMemo(
    () =>
      registered_bidders.map(({ bidder }) => ({
        label: `${bidder.full_name} (${bidder.bidder_number})`,
        value: bidder.bidder_number,
      })),
    [registered_bidders],
  );

  const resetState = () => {
    setDraftRows([createDraftRow(1)]);
    setNextRowId(2);
    setPreviewData([]);
    setIsDirty(false);
    setEditingIndex(null);
    setEditingValues(null);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      resetState();
    }
  };

  const toSheetRecord = (
    row: UploadManifestInput | AddOnDraftRow,
  ): ManifestSheetRecord => ({
    BARCODE: row.BARCODE,
    CONTROL: row.CONTROL,
    DESCRIPTION: row.DESCRIPTION,
    BIDDER: row.BIDDER,
    PRICE: row.PRICE,
    QTY: row.QTY,
    MANIFEST: row.MANIFEST ?? "ADD ON",
  });

  const updateDraftRow = (
    id: string,
    key: keyof ManifestSheetRecord,
    value: string,
  ) => {
    setDraftRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row)),
    );
  };

  const handleAddRow = () => {
    setDraftRows((prev) => [...prev, createDraftRow(nextRowId)]);
    setNextRowId((prev) => prev + 1);
  };

  const handleRemoveDraftRow = (id: string) => {
    setDraftRows((prev) =>
      prev.length === 1 ? prev : prev.filter((row) => row.id !== id),
    );
  };

  const getBidderDefaultValue = (bidderNumber: string) => {
    const option = bidderOptions.find((item) => item.value === bidderNumber);
    return option ? { label: option.label, value: option.value } : undefined;
  };

  const validateDraftRows = () => {
    const required: Array<{
      key: keyof ManifestSheetRecord;
      label: string;
    }> = [
      { key: "BARCODE", label: "Barcode" },
      { key: "DESCRIPTION", label: "Description" },
      { key: "PRICE", label: "Price" },
      { key: "QTY", label: "Qty" },
      { key: "BIDDER", label: "Bidder" },
    ];

    for (const [index, row] of draftRows.entries()) {
      const missing = required.find(
        ({ key }) => !String(row[key] ?? "").trim(),
      );

      if (missing) {
        toast.error("Invalid Data!", {
          description: `Row ${index + 1}: ${missing.label} is required.`,
        });
        return false;
      }
    }

    return true;
  };

  const handlePreview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateDraftRows()) {
      return;
    }

    const rows = draftRows.map(toSheetRecord);
    setLoadingMessage("Checking add on data...");

    try {
      const res = await previewAddOn(auction_id, rows);

      if (res.ok) {
        setPreviewData(res.value);
        setIsDirty(false);
      } else {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValues(toSheetRecord(previewData[index]));
  };

  const handleEditChange = (key: keyof ManifestSheetRecord, value: string) => {
    if (!editingValues) return;
    setEditingValues({ ...editingValues, [key]: value });
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingValues) return;

    setPreviewData((prev) =>
      prev.map((row, index) =>
        index === editingIndex ? { ...row, ...editingValues } : row,
      ),
    );
    setEditingIndex(null);
    setEditingValues(null);
    setIsDirty(true);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValues(null);
  };

  const handleRemoveRow = (index: number) => {
    setPreviewData((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
    setIsDirty(true);

    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValues(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleRevalidate = async () => {
    if (!previewData.length) return;

    setLoadingMessage("Re-validating add on...");

    try {
      const res = await previewAddOn(
        auction_id,
        previewData.map(toSheetRecord),
      );

      if (res.ok) {
        setPreviewData(res.value);
        setIsDirty(false);
      } else {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
    } finally {
      setLoadingMessage(null);
    }
  };

  const handleConfirm = async () => {
    if (!validPreviewRows.length) return;

    setLoadingMessage("Uploading add on...");

    try {
      const res = await confirmAddOn(auction_id, validPreviewRows);

      if (res.ok) {
        toast.success("Successfully uploaded manifest!", {
          description:
            res.value +
            ". Please check the Manifest Page for more information.",
        });
        handleOpenChange(false);
        router.refresh();
      } else {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
    } finally {
      setLoadingMessage(null);
    }
  };

  const focusDraftField = (rowIndex: number, fieldIndex: number) => {
    const container = document.querySelector<HTMLElement>(
      `[data-add-on-field="${rowIndex}-${fieldIndex}"]`,
    );
    const target = container?.matches("input,button")
      ? container
      : container?.querySelector<HTMLElement>("input,button");

    target?.focus();
  };

  const handleDraftKeyDown = (
    event: React.KeyboardEvent<HTMLElement>,
    rowIndex: number,
    fieldIndex: number,
  ) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    let nextRowIndex = rowIndex;
    let nextFieldIndex = fieldIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const direction = event.key === "ArrowRight" ? 1 : -1;
      nextFieldIndex = fieldIndex + direction;

      if (nextFieldIndex >= DRAFT_FIELD_COUNT) {
        nextRowIndex += 1;
        nextFieldIndex = 0;
      }

      if (nextFieldIndex < 0) {
        nextRowIndex -= 1;
        nextFieldIndex = DRAFT_FIELD_COUNT - 1;
      }
    } else {
      nextRowIndex = rowIndex + (event.key === "ArrowDown" ? 1 : -1);

      if (nextRowIndex < 0 || nextRowIndex >= draftRows.length) return;
    }

    if (nextRowIndex < 0 || nextRowIndex >= draftRows.length) return;

    focusDraftField(nextRowIndex, nextFieldIndex);
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>Add On</Button>
        </DialogTrigger>
        <DialogContent
          className={
            step === "preview"
              ? "sm:max-w-5xl max-h-[80vh] flex flex-col"
              : "sm:max-w-6xl max-h-[80vh] flex flex-col"
          }
        >
          <DialogHeader>
            <DialogTitle>
              {step === "upload" ? "Add On" : "Preview Add On Data"}
            </DialogTitle>
            <DialogDescription>
              {step === "upload"
                ? "Check add on data before submitting."
                : `${validPreviewRows.length} valid record(s) ready for review before submit.`}
            </DialogDescription>
          </DialogHeader>

          {step === "upload" ? (
            <form onSubmit={handlePreview} className="space-y-4 overflow-hidden">
              <div className="overflow-x-auto rounded-md border">
                <div className="min-w-[1040px]">
                  <div className="grid grid-cols-[minmax(140px,1fr)_minmax(90px,0.6fr)_minmax(220px,1.4fr)_minmax(110px,0.7fr)_minmax(90px,0.5fr)_minmax(240px,1.5fr)_44px] gap-2 border-b bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                    <div>Barcode</div>
                    <div>Control</div>
                    <div>Description</div>
                    <div>Price</div>
                    <div>Qty</div>
                    <div>Bidder</div>
                    <div />
                  </div>
                  <div className="max-h-[42vh] overflow-y-auto">
                    {draftRows.map((row, index) => (
                      <div
                        key={row.id}
                        className="grid grid-cols-[minmax(140px,1fr)_minmax(90px,0.6fr)_minmax(220px,1.4fr)_minmax(110px,0.7fr)_minmax(90px,0.5fr)_minmax(240px,1.5fr)_44px] gap-2 border-b px-3 py-2 last:border-b-0"
                      >
                        <Input
                          type="text"
                          name={`BARCODE-${index}`}
                          data-add-on-field={`${index}-0`}
                          value={row.BARCODE}
                          onKeyDown={(event) =>
                            handleDraftKeyDown(event, index, 0)
                          }
                          onChange={(event) =>
                            updateDraftRow(
                              row.id,
                              "BARCODE",
                              event.target.value,
                            )
                          }
                          autoComplete="off"
                        />
                        <Input
                          type="text"
                          name={`CONTROL-${index}`}
                          data-add-on-field={`${index}-1`}
                          value={row.CONTROL}
                          onKeyDown={(event) =>
                            handleDraftKeyDown(event, index, 1)
                          }
                          onChange={(event) =>
                            updateDraftRow(
                              row.id,
                              "CONTROL",
                              event.target.value,
                            )
                          }
                          autoComplete="off"
                        />
                        <Input
                          type="text"
                          name={`DESCRIPTION-${index}`}
                          data-add-on-field={`${index}-2`}
                          value={row.DESCRIPTION}
                          onKeyDown={(event) =>
                            handleDraftKeyDown(event, index, 2)
                          }
                          onChange={(event) =>
                            updateDraftRow(
                              row.id,
                              "DESCRIPTION",
                              event.target.value,
                            )
                          }
                          autoComplete="off"
                        />
                        <InputNumber
                          name={`PRICE-${index}`}
                          data-add-on-field={`${index}-3`}
                          min={0}
                          value={
                            row.PRICE.trim() ? Number(row.PRICE) : undefined
                          }
                          onKeyDown={(event) =>
                            handleDraftKeyDown(event, index, 3)
                          }
                          onValueChange={(value) =>
                            updateDraftRow(
                              row.id,
                              "PRICE",
                              value === undefined ? "" : String(value),
                            )
                          }
                          hasStepper={false}
                          autoComplete="off"
                        />
                        <Input
                          type="text"
                          name={`QTY-${index}`}
                          data-add-on-field={`${index}-4`}
                          value={row.QTY}
                          onKeyDown={(event) =>
                            handleDraftKeyDown(event, index, 4)
                          }
                          onChange={(event) =>
                            updateDraftRow(row.id, "QTY", event.target.value)
                          }
                          autoComplete="off"
                        />
                        <div
                          data-add-on-field={`${index}-5`}
                          onKeyDown={(event) =>
                            handleDraftKeyDown(event, index, 5)
                          }
                        >
                          <SelectWithSearch
                            key={`${row.id}-${row.BIDDER}`}
                            modal={true}
                            side="bottom"
                            placeholder="Select Bidder"
                            openOnFocus={true}
                            defaultValue={getBidderDefaultValue(row.BIDDER)}
                            setSelected={(selected) =>
                              updateDraftRow(
                                row.id,
                                "BIDDER",
                                String(selected.value ?? ""),
                              )
                            }
                            onSelectComplete={() => {
                              window.setTimeout(() => {
                                focusDraftField(index, 4);
                              }, 0);
                            }}
                            options={bidderOptions}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove row ${index + 1}`}
                          title="Remove row"
                          disabled={draftRows.length === 1}
                          onClick={() => handleRemoveDraftRow(row.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2Icon className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddRow}
                disabled={isLoading}
              >
                <PlusIcon className="size-4" />
                Add another
              </Button>

              <DialogFooter>
                <DialogClose className="cursor-pointer">Cancel</DialogClose>
                <Button type="submit" disabled={isLoading}>
                  Check Add On
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex flex-col gap-4 overflow-hidden">
              <ManifestPreviewTable
                data={previewData}
                editingIndex={editingIndex}
                editingValues={editingValues}
                onStartEdit={handleStartEdit}
                onEditChange={handleEditChange}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onRemoveRow={handleRemoveRow}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={resetState}
                  disabled={isLoading}
                >
                  Back
                </Button>
                {isDirty ? (
                  <Button
                    onClick={handleRevalidate}
                    disabled={isLoading || previewData.length === 0}
                  >
                    Re-validate
                  </Button>
                ) : (
                  <Button
                    onClick={handleConfirm}
                    disabled={isLoading || validPreviewRows.length === 0}
                  >
                    Confirm Submit
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}

          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-sm">
              <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{loadingMessage}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
