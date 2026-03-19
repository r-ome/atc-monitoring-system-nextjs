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
import { Supplier, UpdateSupplierInput } from "src/entities/models/Supplier";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { updateSupplier } from "../actions";
import { toast } from "sonner";

interface UpdateSupplierModalProps {
  supplier: Omit<Supplier, "containers">;
}

export const UpdateSupplierModal: React.FC<UpdateSupplierModalProps> = ({
  supplier,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [form, setForm] = useState<UpdateSupplierInput>({
    name: "",
    supplier_code: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>();

  useEffect(() => {
    setForm({
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

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (!value) setErrors(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    setErrors(undefined);
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const res = await updateSupplier(supplier.supplier_id, formData);
    setIsLoading(false);

    if (res.ok) {
      toast.success("Successfully updated supplier!");
      setOpen(false);
      router.refresh();
    } else {
      const description =
        typeof res.error?.cause === "string" ? res.error?.cause : null;
      toast.error(res.error.message, { description });
      if (res.error.message === "Invalid Data!") {
        setErrors(res.error.cause as Record<string, string[]>);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, name } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Edit Supplier</Button>
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
              value={form.name}
              name="name"
              onChange={handleChange}
              error={errors}
              required
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Supplier Code:</Label>
            <Input
              value={form.supplier_code}
              name="supplier_code"
              onChange={handleChange}
              required
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Japanese Name:</Label>
            <Input
              value={form.japanese_name ?? ""}
              name="japanese_name"
              onChange={handleChange}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Commission:</Label>
            <Input
              value={form.commission ?? ""}
              name="commission"
              onChange={handleChange}
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Sales Remittance Account:</Label>
            <Input
              value={form.sales_remittance_account ?? ""}
              name="sales_remittance_account"
              onChange={handleChange}
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Shipper:</Label>
            <Input
              value={form.shipper ?? ""}
              name="shipper"
              onChange={handleChange}
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Email:</Label>
            <Input
              value={form.email ?? ""}
              name="email"
              onChange={handleChange}
              error={errors}
            />
          </div>
          <div className="flex gap-2">
            <Label className="w-40">Contact Number:</Label>
            <Input
              value={form.contact_number ?? ""}
              name="contact_number"
              onChange={handleChange}
              error={errors}
            />
          </div>
          <DialogFooter>
            <DialogClose>Cancel</DialogClose>
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
