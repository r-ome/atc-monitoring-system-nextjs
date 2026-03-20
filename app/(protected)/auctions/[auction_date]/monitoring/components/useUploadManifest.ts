"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  previewManifest,
  revalidateManifest,
  confirmUploadManifest,
} from "@/app/(protected)/auctions/actions";
import { toast } from "sonner";
import {
  type ManifestSheetRecord,
  type UploadManifestInput,
} from "src/entities/models/Manifest";

const toSheetRecord = (row: UploadManifestInput): ManifestSheetRecord => ({
  BARCODE: row.BARCODE,
  CONTROL: row.CONTROL,
  DESCRIPTION: row.DESCRIPTION,
  BIDDER: row.BIDDER,
  PRICE: row.PRICE,
  QTY: row.QTY,
  MANIFEST: row.MANIFEST ?? "",
});

const sortInvalidFirst = (data: UploadManifestInput[]) =>
  [...data].sort((a, b) => Number(a.isValid) - Number(b.isValid));

export const useUploadManifest = (auction_id: string) => {
  const router = useRouter();
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [previewData, setPreviewData] = useState<UploadManifestInput[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValues, setEditingValues] =
    useState<ManifestSheetRecord | null>(null);

  const isLoading = loadingMessage !== null;
  const step = previewData.length > 0 ? "preview" : "upload";

  const resetState = () => {
    setPreviewData([]);
    setErrors(undefined);
    setIsDirty(false);
    setEditingIndex(null);
    setEditingValues(null);
  };

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) resetState();
  };

  // --- Preview ---

  const handlePreview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setErrors(undefined);
    setLoadingMessage("Processing manifest data...");

    try {
      const res = await previewManifest(auction_id, formData);

      if (res.ok) {
        setPreviewData(sortInvalidFirst(res.value));
      } else {
        toast.error(res.error.message);
        if (res.error.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        }
      }
    } finally {
      setLoadingMessage(null);
    }
  };

  // --- Remove row ---

  const handleRemoveRow = (index: number) => {
    setPreviewData((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
    if (editingIndex === index) {
      setEditingIndex(null);
      setEditingValues(null);
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex(editingIndex - 1);
    }
  };

  // --- Inline edit ---

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
      prev.map((row, i) =>
        i === editingIndex ? { ...row, ...editingValues } : row,
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

  // --- Re-validate ---

  const handleRevalidate = async () => {
    setLoadingMessage("Re-validating manifest data...");
    try {
      const sheetData = previewData.map(toSheetRecord);
      const res = await revalidateManifest(auction_id, sheetData);

      if (res.ok) {
        setPreviewData(sortInvalidFirst(res.value));
        setIsDirty(false);
      } else {
        toast.error(res.error.message);
      }
    } finally {
      setLoadingMessage(null);
    }
  };

  // --- Confirm upload ---

  const performUpload = async () => {
    setLoadingMessage("Uploading manifest...");
    try {
      const res = await confirmUploadManifest(auction_id, previewData);

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

  return {
    // State
    open,
    step,
    isLoading,
    loadingMessage,
    errors,
    previewData,
    isDirty,
    editingIndex,
    editingValues,
    showConfirm,
    // Dialog
    handleOpenChange,
    resetState,
    // Preview
    handlePreview,
    // Edit
    handleStartEdit,
    handleEditChange,
    handleSaveEdit,
    handleCancelEdit,
    // Remove
    handleRemoveRow,
    // Re-validate & upload
    handleRevalidate,
    handleConfirmUpload: performUpload,
    // Past auction confirm
    setShowConfirm,
  };
};
