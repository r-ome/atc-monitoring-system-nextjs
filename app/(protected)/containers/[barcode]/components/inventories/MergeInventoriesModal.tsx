"use client";

import { Loader2Icon } from "lucide-react";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
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
import { mergeInventories } from "@/app/(protected)/containers/actions";
import { InventoryRowType } from "./ContainerInventoriesTable";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { Separator } from "@/app/components/ui/separator";
import { Label } from "@/app/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group";

interface MergeInventoriesModalProps {
  inventories: InventoryRowType[];
}

export const MergeInventoriesModal: React.FC<MergeInventoriesModalProps> = ({
  inventories,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const res = await mergeInventories(formData);

    if (res) {
      setSearch("");
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully merged inventories!");
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

  const filterList = (inventory: {
    barcode: string;
    description: string;
    control: string;
  }) =>
    [inventory.barcode, inventory.description, inventory.control]
      .filter(Boolean)
      .some((field) => field!.toUpperCase().includes(search));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Merge Inventories</Button>
      </DialogTrigger>
      <DialogContent className="min-w-[700px]">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Adjust Inventories</DialogTitle>
          </DialogHeader>
          <Input onChange={(e) => setSearch(e.target.value)} />

          <div className="flex gap-4">
            <div className="flex-1 rounded-md border">
              <h4 className="mb-4 text-sm text-center flex justify-center items-center h-10 border py-2 leading-none font-medium">
                UNSOLD
              </h4>

              <RadioGroup className="w-full" name="new_inventory_id">
                <ScrollArea className="h-72">
                  <div className="px-4">
                    {inventories
                      .filter((inventory) => inventory.status === "UNSOLD")
                      .filter(filterList)
                      .map((inventory) => (
                        <React.Fragment key={inventory.inventory_id}>
                          <div className="flex gap-4">
                            <div className="flex justify-center items-center">
                              <RadioGroupItem
                                value={inventory.inventory_id}
                                id={inventory.inventory_id}
                              />
                            </div>
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
              </RadioGroup>
            </div>

            <div className="flex-1 rounded-md border">
              <h4 className="mb-4 text-sm text-center flex justify-center items-center h-10 border py-2 leading-none font-medium">
                SOLD BUT NOT BARCODE
              </h4>

              <RadioGroup className="w-full" name="old_inventory_id">
                <ScrollArea className="h-72">
                  <div className="px-4">
                    {inventories
                      .filter(
                        (inventory) =>
                          inventory.barcode.split("-").length === 2 &&
                          inventory.status === "SOLD",
                      )
                      .filter(filterList)
                      .map((inventory) => (
                        <React.Fragment key={inventory.inventory_id}>
                          <div className="flex gap-4">
                            <div className="flex justify-center items-center">
                              <RadioGroupItem
                                value={inventory.inventory_id}
                                id={inventory.inventory_id}
                              />
                            </div>
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
              </RadioGroup>
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
