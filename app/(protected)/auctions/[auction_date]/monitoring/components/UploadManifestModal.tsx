"use client";

import { Loader2Icon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { Input } from "@/app/components/ui/input";
import { format, isPast } from "date-fns";
import { useParams } from "next/navigation";
import { useUploadManifest } from "./useUploadManifest";
import { ManifestPreviewTable } from "./ManifestPreviewTable";

interface UploadManifestModalProps {
  auction_id: string;
}

export const UploadManifestModal: React.FC<UploadManifestModalProps> = ({
  auction_id,
}) => {
  const { auction_date } = useParams();
  const auctionDate = new Date(auction_date as string);
  const manifest = useUploadManifest(auction_id);

  const handleConfirmUpload = async () => {
    if (isPast(auctionDate)) {
      manifest.setShowConfirm(true);
      return;
    }
    await manifest.handleConfirmUpload();
  };

  const handlePastAuctionConfirm = async () => {
    manifest.setShowConfirm(false);
    await manifest.handleConfirmUpload();
  };

  const validCount = manifest.previewData.filter((r) => r.isValid).length;
  const invalidCount = manifest.previewData.length - validCount;

  return (
    <div>
      <Dialog open={manifest.open} onOpenChange={manifest.handleOpenChange}>
        <DialogTrigger asChild>
          <Button>Encode Manifest</Button>
        </DialogTrigger>
        <DialogContent
          className={
            manifest.step === "preview"
              ? "sm:max-w-5xl max-h-[80vh] flex flex-col"
              : ""
          }
        >
          <DialogHeader>
            <DialogTitle>
              {manifest.step === "upload" ? (
                <>
                  Upload Manifest{" "}
                  <a href="/MANIFEST_TEMPLATE.xlsx" download>
                    (DOWNLOAD TEMPLATE HERE)
                  </a>
                </>
              ) : (
                "Preview Manifest Data"
              )}
            </DialogTitle>
            <DialogDescription>
              {manifest.step === "upload"
                ? "Upload manifest sheet here for monitoring."
                : `${manifest.previewData.length} record(s) found — ${validCount} valid, ${invalidCount} invalid. Please review before uploading.`}
            </DialogDescription>
          </DialogHeader>

          {manifest.step === "upload" ? (
            <form onSubmit={manifest.handlePreview} className="space-y-4">
              <Input
                id="file"
                name="file"
                type="file"
                className="cursor-pointer"
                required
                error={manifest.errors}
              />
              <DialogFooter>
                <DialogClose className="cursor-pointer">Cancel</DialogClose>
                <Button type="submit" disabled={manifest.isLoading}>
                  Preview
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex flex-col gap-4 overflow-hidden">
              <ManifestPreviewTable
                data={manifest.previewData}
                editingIndex={manifest.editingIndex}
                editingValues={manifest.editingValues}
                onStartEdit={manifest.handleStartEdit}
                onEditChange={manifest.handleEditChange}
                onSaveEdit={manifest.handleSaveEdit}
                onCancelEdit={manifest.handleCancelEdit}
                onRemoveRow={manifest.handleRemoveRow}
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={manifest.resetState}
                  disabled={manifest.isLoading}
                >
                  Back
                </Button>
                {manifest.isDirty ? (
                  <Button
                    onClick={manifest.handleRevalidate}
                    disabled={manifest.isLoading}
                  >
                    Re-validate
                  </Button>
                ) : (
                  <Button
                    onClick={handleConfirmUpload}
                    disabled={manifest.isLoading}
                  >
                    Confirm Upload
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}

          {manifest.isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-lg bg-background/80 backdrop-blur-sm">
              <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {manifest.loadingMessage}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={manifest.showConfirm}
        onOpenChange={manifest.setShowConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload to Past Auction?</AlertDialogTitle>
            <AlertDialogDescription>
              The auction date{" "}
              <span className="font-semibold text-foreground">
                {format(auctionDate, "MMMM d, yyyy")}
              </span>{" "}
              has already passed. Are you sure you want to upload a manifest for
              this auction?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePastAuctionConfirm}>
              Yes, upload anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
