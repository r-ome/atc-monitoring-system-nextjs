"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  previewAddOn,
  confirmAddOn,
} from "@/app/(protected)/auctions/actions";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
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

export const AddOnModal: React.FC<AddOnModalProps> = ({
  auction_id,
  registered_bidders,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [selectedBidder, setSelectedBidder] = useState<{
    [key: string]: string;
  }>();
  const [previewData, setPreviewData] = useState<UploadManifestInput[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] =
    useState<ManifestSheetRecord | null>(null);

  const isLoading = loadingMessage !== null;
  const step = previewData.length > 0 ? "preview" : "upload";

  const resetState = () => {
    setPreviewData([]);
    setEditingIndex(null);
    setEditingValues(null);
    setSelectedBidder(undefined);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);

    if (!value) {
      resetState();
    }
  };

  const toSheetRecord = (row: UploadManifestInput): ManifestSheetRecord => ({
    BARCODE: row.BARCODE,
    CONTROL: row.CONTROL,
    DESCRIPTION: row.DESCRIPTION,
    BIDDER: row.BIDDER,
    PRICE: row.PRICE,
    QTY: row.QTY,
    MANIFEST: row.MANIFEST ?? "ADD ON",
  });

  const toFormData = (row: ManifestSheetRecord) => {
    const formData = new FormData();

    for (const [key, value] of Object.entries(row)) {
      formData.append(key, value);
    }

    return formData;
  };

  const handlePreview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedBidder) {
      toast.error("Invalid Data!", {
        description: "Bidder is required.",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.append("BIDDER", selectedBidder.value);
    formData.append("MANIFEST", "ADD ON");
    setLoadingMessage("Checking add on data...");

    try {
      const res = await previewAddOn(auction_id, formData);

      if (res.ok) {
        setPreviewData(res.value);
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
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingValues(null);
  };

  const handleRemoveRow = (index: number) => {
    setPreviewData((prev) => prev.filter((_, rowIndex) => rowIndex !== index));

    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValues(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  const handleRevalidate = async () => {
    const currentRow = previewData[0];
    if (!currentRow) return;

    setLoadingMessage("Re-validating add on...");

    try {
      const res = await previewAddOn(
        auction_id,
        toFormData(toSheetRecord(currentRow)),
      );

      if (res.ok) {
        setPreviewData(res.value);
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
    setLoadingMessage("Uploading add on...");

    try {
      const res = await confirmAddOn(auction_id, previewData);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!["ArrowDown", "ArrowUp"].includes(e.key)) return;
    const FIELD_ORDER = [
      "BARCODE",
      "CONTROL",
      "DESCRIPTION",
      "PRICE",
      "QTY",
      "MANIFEST",
    ];

    e.preventDefault();

    const currentName = e.currentTarget.name;
    const currentIndex = FIELD_ORDER.indexOf(currentName);
    const nextOrder = e.key === "ArrowUp" ? currentIndex - 1 : currentIndex + 1;
    const nextName = FIELD_ORDER[nextOrder];

    if (!nextName) return;

    const nextInput = document.querySelector<HTMLInputElement>(
      `input[name="${nextName}"]`,
    );

    nextInput?.focus();
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button>Add On</Button>
        </DialogTrigger>
        <DialogContent
          className={
            step === "preview" ? "sm:max-w-5xl max-h-[80vh] flex flex-col" : ""
          }
        >
          <DialogHeader>
            <DialogTitle>
              {step === "upload" ? "Add On" : "Preview Add On Data"}
            </DialogTitle>
            <DialogDescription>
              {step === "upload"
                ? "Check add on data before submitting."
                : `${previewData.length} record(s) ready for review before submit.`}
            </DialogDescription>
          </DialogHeader>

          {step === "upload" ? (
            <form onSubmit={handlePreview} className="space-y-4">
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="BARCODE">Barcode: </Label>
                <Input
                  type="text"
                  id="BARCODE"
                  name="BARCODE"
                  onKeyDown={handleKeyDown}
                  required
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="CONTROL">Control: </Label>
                <Input
                  type="text"
                  id="CONTROL"
                  name="CONTROL"
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="DESCRIPTION">Description: </Label>
                <Input
                  type="text"
                  id="DESCRIPTION"
                  name="DESCRIPTION"
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="PRICE">Price: </Label>
                <InputNumber
                  id="PRICE"
                  name="PRICE"
                  min={0}
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="QTY">Qty: </Label>
                <Input
                  type="text"
                  id="QTY"
                  name="QTY"
                  onKeyDown={handleKeyDown}
                  autoComplete="off"
                  required
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="bidder">Bidder: </Label>
                <SelectWithSearch
                  modal={true}
                  side="bottom"
                  placeholder="Select Bidder"
                  setSelected={(selected) =>
                    setSelectedBidder(selected as Record<string, string>)
                  }
                  options={registered_bidders.map(({ bidder }) => ({
                    label: `${bidder.full_name} (${bidder.bidder_number})`,
                    value: bidder.bidder_number,
                  }))}
                />
              </div>

              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="MANIFEST">Manifest: </Label>
                <Input
                  type="text"
                  id="MANIFEST"
                  name="MANIFEST"
                  value="ADD ON"
                  disabled
                />
              </div>

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
                <Button
                  variant="outline"
                  onClick={handleRevalidate}
                  disabled={isLoading || previewData.length === 0}
                >
                  Re-validate
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading || previewData.length === 0}
                >
                  Confirm Submit
                </Button>
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
