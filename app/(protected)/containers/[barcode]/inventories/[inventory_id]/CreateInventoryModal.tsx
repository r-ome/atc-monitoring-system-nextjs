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
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { createInventory } from "@/app/(protected)/inventories/actions";
import { InputNumber } from "@/app/components/ui/InputNumber";

interface CreateInventoryModalProps {
  container: {
    container_id: string;
    barcode: string;
  };
}

export const CreateInventoryModal: React.FC<CreateInventoryModalProps> = ({
  container,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpenDialog] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.append("container_id", container.container_id);

    const barcode = formData.get("barcode");
    if (!barcode) {
      formData.set("barcode", `${container.barcode}`);
    }

    setIsLoading(false);

    const res = await createInventory(formData);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated inventory!");
        router.refresh();
        setOpenDialog(false);
      } else {
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
      <Button onClick={() => setOpenDialog(true)}>Create Inventory</Button>
      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Inventory</DialogTitle>
            <DialogDescription>You can create item here</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex">
              <Label htmlFor="container" className="w-40">
                Container
              </Label>
              <Input value={container.barcode} disabled />
            </div>
            <div className="flex">
              <Label htmlFor="barcode" className="w-40">
                Barcode
              </Label>
              <div className="w-full">
                <InputNumber
                  name="barcode"
                  error={errors}
                  hasStepper={false}
                  prefix={`${container.barcode}-`}
                />
              </div>
            </div>
            <div className="flex">
              <Label htmlFor="control" className="w-40">
                Control
              </Label>
              <div className="w-full">
                <InputNumber
                  name="control"
                  error={errors}
                  hasStepper={false}
                  required
                />
              </div>
            </div>
            <div className="flex">
              <Label htmlFor="description" className="w-40">
                Description
              </Label>
              <Input name="description" required />
            </div>
            <div className="flex">
              <Label htmlFor="status" className="w-40">
                Status
              </Label>
              <Input name="status" value="UNSOLD" disabled />
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
