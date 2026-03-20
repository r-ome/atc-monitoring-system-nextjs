"use client";

import { Loader2Icon } from "lucide-react";
import { useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { uploadManifest } from "@/app/(protected)/auctions/actions";
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
import { toast } from "sonner";
import { format, isPast } from "date-fns";

interface UploadManifestModalProps {
  auction_id: string;
}

export const UploadManifestModal: React.FC<UploadManifestModalProps> = ({
  auction_id,
}) => {
  const router = useRouter();
  const { auction_date } = useParams();
  const auctionDate = new Date(auction_date as string);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const pendingFormData = useRef<FormData | null>(null);

  const performUpload = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const res = await uploadManifest(auction_id, formData);

      if (res.ok) {
        toast.success("Successfully uploaded manifest!", {
          description:
            res.value +
            ". Please check the Manifest Page for more information.",
        });
        setOpen(false);
        router.refresh();
      } else {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
        if (res.error.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    if (isPast(auctionDate)) {
      pendingFormData.current = formData;
      setShowConfirm(true);
      return;
    }

    await performUpload(formData);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    if (pendingFormData.current) {
      await performUpload(pendingFormData.current);
      pendingFormData.current = null;
    }
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Encode Manifest</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Upload Manifest{" "}
              <a href="/MANIFEST_TEMPLATE.xlsx" download>
                (DOWNLOAD TEMPLATE HERE)
              </a>
            </DialogTitle>
            <DialogDescription>
              Upload manifest sheet here for monitoring.{" "}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="file"
              name="file"
              type="file"
              className="cursor-pointer"
              required
              error={errors}
            />
            <DialogFooter>
              <DialogClose className="cursor-pointer">Cancel</DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
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
            <AlertDialogAction onClick={handleConfirm}>
              Yes, upload anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
