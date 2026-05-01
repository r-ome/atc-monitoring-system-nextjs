"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
import { formatDate, formatNumberPadding } from "@/app/lib/utils";
import { Branch } from "src/entities/models/Branch";
import { Supplier } from "src/entities/models/Supplier";
import { getBranches } from "@/app/(protected)/branches/actions";
import { getSuppliers } from "@/app/(protected)/suppliers/actions";
import { createContainer } from "@/app/(protected)/containers/actions";

type Option = Record<string, string | number | boolean>;

const ALLOWED_CONTAINER_BRANCHES = new Set(["BIÑAN", "TARLAC"]);

type CreateContainerReview = {
  supplier: string;
  branch: string;
  container_barcode: string;
  bill_of_lading_number: string;
  container_number: string;
  barcode: string;
  duties_and_taxes: string;
  gross_weight: string;
  gross_weight_tons: string;
  arrival_date: string;
  due_date: string;
  formData: FormData;
};

export const CreateContainerModal = () => {
  const router = useRouter();
  const session = useSession();
  const user = session.data?.user;

  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>();
  const [review, setReview] = useState<CreateContainerReview | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Omit<Supplier, "containers">[]>(
    [],
  );
  const [selectedSupplier, setSelectedSupplier] = useState<Option | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Option | undefined>();
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>();
  const [shipmentNumber, setShipmentNumber] = useState<number | undefined>();
  const [weightInTons, setWeightInTons] = useState<number>(0);
  const hasInvalidShipmentNumber =
    shipmentNumber !== undefined && shipmentNumber < 0;
  const selectedBranchName = branches.find(
    (branch) => branch.branch_id === selectedBranch?.value,
  )?.name;
  const hasInvalidBranch =
    !!selectedBranch && !ALLOWED_CONTAINER_BRANCHES.has(selectedBranchName ?? "");
  const formErrors = {
    ...errors,
    ...(hasInvalidShipmentNumber
      ? { barcode: ["Number of Shipment must not be negative"] }
      : {}),
    ...(hasInvalidBranch
      ? { branch_id: ["Container branch must be BIÑAN or TARLAC"] }
      : {}),
  };

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
      setShipmentNumber(undefined);
      setWeightInTons(0);
      setReview(null);
      setConfirmOpen(false);
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

    if (hasInvalidBranch) {
      setErrors({ branch_id: ["Container branch must be BIÑAN or TARLAC"] });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const barcode = Number(formData.get("barcode"));
    if (barcode < 0) {
      setErrors({ barcode: ["Number of Shipment must not be negative"] });
      return;
    }

    const supplier_id = selectedSupplier.value as string;
    const branch_id = selectedBranch.value as string;
    formData.append("supplier_id", supplier_id);
    formData.append("branch_id", branch_id);
    formData.append(
      "arrival_date",
      arrivalDate ? arrivalDate.toISOString() : "",
    );
    formData.append("auction_or_sell", "AUCTION");
    const supplier = suppliers.find(
      (item) => item.supplier_id === selectedSupplier.value,
    );
    const branch = branches.find((item) => item.branch_id === branch_id);
    const container_barcode = `${supplier?.supplier_code ?? selectedSupplier.label}-${formatNumberPadding(
      formData.get("barcode")?.toString() ?? "",
      2,
    )}`;

    setReview({
      supplier: String(selectedSupplier.label ?? supplier_id),
      branch: branch?.name ?? String(selectedBranch.label ?? branch_id),
      container_barcode,
      bill_of_lading_number:
        String(formData.get("bill_of_lading_number") ?? "") || "N/A",
      container_number: String(formData.get("container_number") ?? "") || "N/A",
      barcode: String(formData.get("barcode") ?? ""),
      duties_and_taxes: String(formData.get("duties_and_taxes") ?? "") || "0",
      gross_weight: String(formData.get("gross_weight") ?? "") || "0",
      gross_weight_tons: weightInTons.toFixed(2),
      arrival_date: arrivalDate
        ? formatDate(arrivalDate, "MMM dd, yyyy")
        : "N/A",
      due_date: arrivalDate
        ? formatDate(addDays(arrivalDate, 40), "MMM dd, yyyy")
        : "N/A",
      formData,
    });
    setConfirmOpen(true);
  };

  const handleConfirmCreate = async () => {
    if (!review) return;
    setIsLoading(true);
    const res = await createContainer(review.formData);
    setIsLoading(false);

    if (res.ok) {
      toast.success("Successfully created Container!");
      setConfirmOpen(false);
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
              {formErrors?.branch_id?.[0] ? (
                <span className="text-red-500 -mt-1 text-xs">
                  {formErrors.branch_id[0]}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Bill of Lading Number</Label>
              <Input name="bill_of_lading_number" error={formErrors} />
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Container Number</Label>
              <Input name="container_number" error={formErrors} />
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Number of Shipment</Label>
              <InputNumber
                name="barcode"
                min={0}
                required
                error={formErrors}
                onValueChange={setShipmentNumber}
              />
            </div>
            <div className="flex flex-col gap-2 w-1/2">
              <Label>Duties and Taxes</Label>
              <InputNumber
                name="duties_and_taxes"
                decimalScale={2}
                hasStepper={false}
                error={formErrors}
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
                error={formErrors}
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
            <Button
              type="submit"
              disabled={isLoading || hasInvalidShipmentNumber || hasInvalidBranch}
            >
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Confirm Container Details</DialogTitle>
            <DialogDescription>
              Review the entered information before creating the container.
            </DialogDescription>
          </DialogHeader>
          {review ? (
            <div className="grid grid-cols-[180px_1fr] gap-x-4 gap-y-3 text-sm">
              <span className="text-muted-foreground">Supplier</span>
              <span className="font-medium">{review.supplier}</span>
              <span className="text-muted-foreground">Branch</span>
              <span className="font-medium">{review.branch}</span>
              <span className="text-muted-foreground">Container Barcode</span>
              <span className="font-medium">{review.container_barcode}</span>
              <span className="text-muted-foreground">Bill of Lading</span>
              <span className="font-medium">{review.bill_of_lading_number}</span>
              <span className="text-muted-foreground">Container Number</span>
              <span className="font-medium">{review.container_number}</span>
              <span className="text-muted-foreground">Number of Shipment</span>
              <span className="font-medium">{review.barcode}</span>
              <span className="text-muted-foreground">Duties and Taxes</span>
              <span className="font-medium">{review.duties_and_taxes}</span>
              <span className="text-muted-foreground">Gross Weight</span>
              <span className="font-medium">
                {review.gross_weight} kg / {review.gross_weight_tons} tons
              </span>
              <span className="text-muted-foreground">Arrival Date</span>
              <span className="font-medium">{review.arrival_date}</span>
              <span className="text-muted-foreground">Due Date</span>
              <span className="font-medium">{review.due_date}</span>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={isLoading}
              onClick={() => setConfirmOpen(false)}
            >
              Back
            </Button>
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleConfirmCreate}
            >
              {isLoading && <Loader2Icon className="animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
