"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";
import { uploadInventoryFile } from "@/app/(protected)/containers/actions";

export const UploadInventoryModal = () => {
  const { barcode }: { barcode: string } = useParams();
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setErrors({});

    const formData = new FormData(event.currentTarget);
    const res = await uploadInventoryFile(barcode, formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully uploaded inventories!");
        setOpen(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload Inventory File</Button>
      </DialogTrigger>
      <DialogContent className="w-[425px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>
              Upload Inventory File{" "}
              <a href="/INVENTORY_TEMPLATE.xlsx" download>
                (DOWNLOAD TEMPLATE HERE)
              </a>
            </DialogTitle>
          </DialogHeader>

          <Input
            id="file"
            name="file"
            type="file"
            className="cursor-pointer"
            error={errors}
            required
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant={"outline"} className="cursor-pointer">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
