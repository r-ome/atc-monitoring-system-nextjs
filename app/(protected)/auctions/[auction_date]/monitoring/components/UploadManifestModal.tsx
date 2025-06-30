"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";

interface UploadManifestModalProps {
  auction_id: string;
}

export const UploadManifestModal: React.FC<UploadManifestModalProps> = ({
  auction_id,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await uploadManifest(auction_id, formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully uploaded manifest!", {
          description:
            res.value +
            ". Please check the Manifest Page for more information.",
        });
        setOpen(false);
        router.refresh();
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
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
            <DialogTitle>Upload Manifest</DialogTitle>
            <DialogDescription>
              Upload manifest sheet here for monitoring
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="file"
              name="file"
              type="file"
              className="cursor-pointer"
              required
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
    </div>
  );
};
