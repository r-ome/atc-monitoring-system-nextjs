"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { DatePicker } from "@/app/components/ui/datepicker";
import { SelectWithSearch } from "@/app/components/ui/SelectWithSearch";
import { Skeleton } from "@/app/components/ui/skeleton";
import { toast } from "sonner";
import { addDays } from "date-fns";
import { formatDate } from "@/app/lib/utils";
import { Branch } from "src/entities/models/Branch";
import { Supplier } from "src/entities/models/Supplier";
import { getBranches } from "@/app/(protected)/branches/actions";
import { getSuppliers } from "@/app/(protected)/suppliers/actions";
import { createContainer } from "@/app/(protected)/containers/actions";

type Option = Record<string, string | number | boolean>;

export const CreateContainerModal = () => {
  const router = useRouter();
  const session = useSession();
  const user = session.data?.user;

  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Omit<Supplier, "containers">[]>(
    [],
  );
  const [selectedSupplier, setSelectedSupplier] = useState<Option | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Option | undefined>();
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>();
  const [weightInTons, setWeightInTons] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    setSelectedBranch({
      label: user.branch.name,
      value: user.branch.branch_id,
    });
  }, [user]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) {
      setErrors(undefined);
      setSelectedSupplier(null);
      setArrivalDate(undefined);
      setWeightInTons(0);
      const fetchData = async () => {
        const [suppliersRes, branchesRes] = await Promise.all([
          getSuppliers(),
          getBranches(),
        ]);
        if (suppliersRes.ok) setSuppliers(suppliersRes.value);
        if (branchesRes.ok) setBranches(branchesRes.value);
      };
      fetchData();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedBranch || !selectedSupplier) {
      toast.error("Please select a Branch and Supplier");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.append("supplier_id", selectedSupplier.value as string);
    formData.append("branch_id", selectedBranch.value as string);
    formData.append(
      "arrival_date",
      arrivalDate ? arrivalDate.toISOString() : "",
    );
    formData.append("auction_or_sell", "AUCTION");

    setIsLoading(true);
    const res = await createContainer(formData);
    setIsLoading(false);

    if (res.ok) {
      toast.success("Successfully created Container!");
      setOpen(false);
      router.push(`/containers/${res.value?.barcode}`);
    } else {
      toast.error(res.error.message);
      if (res.error.message === "Invalid Data!") {
        setErrors(res.error.cause as Record<string, string[]>);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Create Container</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Container</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Supplier</Label>
              {suppliers.length ? (
                <SelectWithSearch
                  placeholder="Search Supplier"
                  options={suppliers.map((s) => ({
                    label: `${s.name} (${s.supplier_code})`,
                    value: s.supplier_id,
                  }))}
                  setSelected={setSelectedSupplier}
                />
              ) : (
                <Skeleton className="w-full h-[36px]" />
              )}
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Branch</Label>
              {branches.length ? (
                <SelectWithSearch
                  placeholder="Search Branch"
                  options={branches.map((b) => ({
                    label: b.name,
                    value: b.branch_id,
                  }))}
                  setSelected={setSelectedBranch}
                  defaultValue={
                    selectedBranch as { label: string; value: string }
                  }
                  disabled={
                    !["OWNER", "SUPER_ADMIN"].includes(user?.role ?? "")
                  }
                />
              ) : (
                <Skeleton className="w-full h-[36px]" />
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Bill of Lading Number</Label>
              <Input name="bill_of_lading_number" error={errors} />
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Container Number</Label>
              <Input name="container_number" error={errors} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Number of Shipment</Label>
              <InputNumber name="barcode" required error={errors} />
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Duties and Taxes</Label>
              <InputNumber
                name="duties_and_taxes"
                decimalScale={2}
                hasStepper={false}
                error={errors}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Gross Weight (KG)</Label>
              <InputNumber
                name="gross_weight"
                onChange={(e) =>
                  setWeightInTons(Number(e.target.value) * 0.001)
                }
                error={errors}
              />
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Gross Weight (Tons)</Label>
              <InputNumber
                value={weightInTons}
                decimalScale={4}
                disabled
                hasStepper={false}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Arrival Date</Label>
              <DatePicker
                id="arrival_date"
                name="arrival_date"
                date={arrivalDate}
                onChange={setArrivalDate}
              />
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Due Date</Label>
              <Input
                disabled
                value={
                  arrivalDate
                    ? formatDate(addDays(arrivalDate, 40), "MMM dd, yyyy")
                    : ""
                }
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isLoading}>
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
