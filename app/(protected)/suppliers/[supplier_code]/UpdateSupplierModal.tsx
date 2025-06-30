"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Supplier } from "src/entities/models/Supplier";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { updateSupplier } from "../actions";
import { toast } from "sonner";

interface UpdateSupplierModalProps {
  supplier: Omit<Supplier, "containers">;
}

type UpdateSupplierForm = {
  name?: string;
  supplier_code?: string;
  japanese_name?: string;
  commission?: string;
  sales_remittance_account?: string;
  shipper?: string;
  email?: string;
  contact_number?: string;
};

export const UpdateSupplierModal: React.FC<UpdateSupplierModalProps> = ({
  supplier,
}) => {
  const router = useRouter();
  const [open, onOpenChange] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newSupplier, setNewSupplier] = useState<UpdateSupplierForm>({});
  const [errors, setErrors] = useState<Record<string, string[]>>();

  useEffect(() => {
    setNewSupplier({
      name: supplier.name,
      supplier_code: supplier.supplier_code,
      japanese_name: supplier.japanese_name,
      commission: supplier.commission,
      sales_remittance_account: supplier.sales_remittance_account,
      shipper: supplier.shipper,
      email: supplier.email,
      contact_number: supplier.contact_number,
    });
  }, [supplier]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const res = await updateSupplier(supplier.supplier_id, formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated supplier!");
        onOpenChange(false);
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
    const { value, name } = e.target;
    setNewSupplier((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>Edit Supplier</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Supplier</DialogTitle>
          <DialogDescription>You can update supplier here</DialogDescription>
        </DialogHeader>
        <form className="space-y-2" onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <Label className="w-40">Supplier Name:</Label>
            <Input
              value={newSupplier.name}
              name="name"
              onChange={handleUpdateChange}
              error={errors}
              required
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Supplier Code:</Label>
            <Input
              value={newSupplier.supplier_code}
              name="supplier_code"
              onChange={handleUpdateChange}
              required
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Japanese Name:</Label>
            <Input
              value={newSupplier.japanese_name}
              name="japanese_name"
              onChange={handleUpdateChange}
              required
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Commission:</Label>
            <Input
              value={newSupplier.commission}
              name="commission"
              onChange={handleUpdateChange}
              error={errors}
              required
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Sales Remittance Account:</Label>
            <Input
              value={newSupplier.sales_remittance_account}
              name="sales_remittance_account"
              onChange={handleUpdateChange}
              required
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Shipper:</Label>
            <Input
              value={newSupplier.shipper}
              name="shipper"
              onChange={handleUpdateChange}
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Email:</Label>
            <Input
              value={newSupplier.email}
              name="email"
              onChange={handleUpdateChange}
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Contact Number:</Label>
            <Input
              value={newSupplier.contact_number}
              name="contact_number"
              onChange={handleUpdateChange}
              error={errors}
            />
          </div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
            <Button type="submit">
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
