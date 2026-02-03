"use client";

import { Loader2Icon } from "lucide-react";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { appendInventories } from "@/app/(protected)/containers/actions";
import { InventoryRowType } from "./ContainerInventoriesTable";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import { Label } from "@/app/components/ui/label";

interface AppendInventoriesModalProps {
  inventories: InventoryRowType[];
}

export const AppendInventoriesModal: React.FC<AppendInventoriesModalProps> = ({
  inventories,
}) => {
  const { barcode }: { barcode: string } = useParams();
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const inventoriesWithoutBarcode = inventories.filter(
    (inventory) =>
      inventory.barcode.split("-").length === 2 && inventory.status === "SOLD",
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const inventoryIds = inventoriesWithoutBarcode.map(
      (inventory) => inventory.inventory_id,
    );

    const res = await appendInventories(barcode, inventoryIds);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully appended inventories!");
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={inventoriesWithoutBarcode.length === 0}>
          Append Inventories
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Append Inventories</DialogTitle>
          </DialogHeader>

          <div className="flex gap-4">
            <div className="flex-1 rounded-md border">
              <h4 className="mb-4 text-sm text-center flex justify-center items-center h-10 border py-2 leading-none font-medium">
                SOLD ITEMS WITHOUT CONTAINER BARCODE
              </h4>

              <ScrollArea className="h-72">
                <div className="px-4">
                  {inventoriesWithoutBarcode.map((inventory) => (
                    <React.Fragment key={inventory.inventory_id}>
                      <div className="flex gap-4">
                        <div className="text-sm justify-between">
                          <Label htmlFor={inventory.inventory_id}>
                            <div>{inventory.barcode}</div>
                            <div>{inventory.control}</div>
                            <div>{inventory.description}</div>
                          </Label>
                        </div>
                      </div>
                      <Separator className="my-2" />
                    </React.Fragment>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

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
