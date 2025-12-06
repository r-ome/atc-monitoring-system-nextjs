"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { updateInventory } from "@/app/(protected)/inventories/actions";

interface UpdateInventoryModalProps {
  inventory: Omit<Inventory, "auctions_inventory" | "histories">;
}

type UpdateInventoryForm = {
  barcode?: string;
  control?: string;
  description?: string;
};

export const UpdateInventoryModal: React.FC<UpdateInventoryModalProps> = ({
  inventory,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpenDialog] = useState<boolean>(false);
  const [newInventory, setNewInventory] = useState<UpdateInventoryForm>();

  useEffect(() => {
    setNewInventory({
      barcode: inventory.barcode,
      control: inventory.control,
      description: inventory.description,
    });
  }, [inventory]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.append("container_id", inventory.container.container_id);

    const res = await updateInventory(inventory.inventory_id, formData);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated inventory!");
        router.refresh();
        setOpenDialog(false);
      } else {
        toast.error("error");
      }
    }
  };

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;

    setNewInventory((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Edit Item</Button>
      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>You can edit item here</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex">
              <Label htmlFor="barcode" className="w-40">
                Barcode
              </Label>
              <Input
                name="barcode"
                value={newInventory?.barcode}
                onChange={handleUpdateChange}
                required
              />
            </div>
            <div className="flex">
              <Label htmlFor="control" className="w-40">
                Control
              </Label>
              <Input
                name="control"
                value={newInventory?.control}
                onChange={handleUpdateChange}
                required
              />
            </div>
            <div className="flex">
              <Label htmlFor="description" className="w-40">
                Description
              </Label>
              <Input
                name="description"
                value={newInventory?.description}
                onChange={handleUpdateChange}
                required
              />
            </div>

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
