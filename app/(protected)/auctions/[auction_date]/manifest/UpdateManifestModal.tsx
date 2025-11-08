"use client";

import { SetStateAction, useState, useEffect } from "react";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { updateManifest } from "@/app/(protected)/auctions/actions";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import { Manifest } from "src/entities/models/Manifest";

type UpdateManifestForm = {
  barcode: string | null;
  control: string | null;
  description: string | null;
  bidder_number: string | null;
  price: string | null;
  qty: string | null;
  manifest_number: string | null;
};

interface UpdateManifestProps {
  open: boolean;
  setOpen: React.Dispatch<SetStateAction<boolean>>;
  selected: Manifest;
}

export const UpdateManifestModal: React.FC<UpdateManifestProps> = ({
  open,
  setOpen,
  selected,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [newSelected, setNewSelected] = useState<UpdateManifestForm>(selected);

  useEffect(() => {
    setNewSelected({
      barcode: selected?.barcode,
      control: selected?.control,
      description: selected?.description,
      bidder_number: selected?.bidder_number,
      price: selected?.price,
      qty: selected?.qty,
      manifest_number: selected?.manifest_number,
    });
  }, [selected]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    if (!selected) return;

    const formData = new FormData(event.currentTarget);
    formData.append("error", JSON.stringify(selected?.error_message));
    formData.append("manifest_id", selected.manifest_id);
    const res = await updateManifest(
      selected.auction_id,
      selected.manifest_id,
      formData
    );

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated manifest!");
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

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;
    setNewSelected((prev) => ({ ...prev, [name]: value }));
  };

  if (!selected) return null;

  return (
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Counter Check</DialogTitle>
            <DialogDescription>Update Counter Check details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <Label htmlFor="barcode" className="w-40">
                Barcode:
              </Label>
              <Input
                name="barcode"
                value={newSelected?.barcode || ""}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="control" className="w-40">
                Control Number:
              </Label>
              <Input
                name="control"
                value={newSelected?.control || ""}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="description" className="w-40">
                Description:
              </Label>
              <Input
                name="description"
                value={newSelected?.description || ""}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="bidder_number" className="w-40">
                Bidder Number:
              </Label>
              <Input
                name="bidder_number"
                value={newSelected?.bidder_number || ""}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="qty" className="w-40">
                Quantity:
              </Label>
              <Input
                name="qty"
                value={newSelected?.qty || ""}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="price" className="w-40">
                Price:
              </Label>
              <Input
                name="price"
                value={newSelected?.price || ""}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="manifest_number" className="w-40">
                Manifest Number:
              </Label>
              <Input
                name="manifest_number"
                value={newSelected?.manifest_number || ""}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
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
