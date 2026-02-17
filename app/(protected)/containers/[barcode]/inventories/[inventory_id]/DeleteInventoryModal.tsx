"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from "@/app/components/ui/dialog";
import { Inventory } from "src/entities/models/Inventory";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import { deleteInventory } from "@/app/(protected)/inventories/actions";

interface DeleteInventoryModalProps {
  inventory: Omit<Inventory, "auctions_inventory" | "histories">;
}

export const DeleteInventoryModal: React.FC<DeleteInventoryModalProps> = ({
  inventory,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpenDialog] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.append("container_id", inventory.container.container_id);

    const res = await deleteInventory(inventory.inventory_id);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully deleted inventory!");
        router.refresh();
        setOpenDialog(false);
      } else {
        toast.error("error");
      }
    }
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setOpenDialog(true)}
        disabled={inventory.status !== "UNSOLD"}
      >
        Delete Item
      </Button>
      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item?
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
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
