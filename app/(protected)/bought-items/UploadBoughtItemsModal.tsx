"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";
import { uploadBoughtItems } from "@/app/(protected)/inventories/actions";

interface UploadBoughtItemsModalProps {
  selectedBranch: { branch_id: string; name: string } | null;
}

export const UploadBoughtItemsModal: React.FC<UploadBoughtItemsModalProps> = ({
  selectedBranch,
}) => {
  const router = useRouter();
  const [open, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);

    if (!selectedBranch) return;

    const res = await uploadBoughtItems(selectedBranch?.branch_id, formData);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully uploaded bought items!");
        setOpenDialog(false);
        router.refresh();
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
        if (res.error.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        }
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Upload Bought Items</Button>

      <Dialog open={open} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bought Items</DialogTitle>
            <DialogDescription>Upload bought items</DialogDescription>
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
    </>
  );
};
