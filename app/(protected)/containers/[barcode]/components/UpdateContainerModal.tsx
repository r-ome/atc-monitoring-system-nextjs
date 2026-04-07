"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { Container } from "src/entities/models/Container";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { DatePicker } from "@/app/components/ui/datepicker";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { updateContainer } from "@/app/(protected)/containers/actions";
import { SelectWithSearch } from "@/app/components/ui/SelectWithSearch";
import { getSuppliers } from "@/app/(protected)/suppliers/actions";
import { getBranches } from "@/app/(protected)/branches/actions";
import { Supplier } from "src/entities/models/Supplier";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Branch } from "src/entities/models/Branch";
import { toast } from "sonner";

interface UpdateContainerModalProps {
  container: Omit<Container, "inventories">;
}

type ContainerUpdateForm = {
  supplier_id: string;
  branch_id: string;
  barcode: string;
  bill_of_lading_number: string;
  gross_weight: string;
  container_number: string;
  auction_or_sell: "AUCTION" | "SELL";
  duties_and_taxes: number;
};

type ComparableContainerState = ContainerUpdateForm & {
  arrival_date: string;
};

type Option = {
  label: string;
  value: string;
  [key: string]: string | number | boolean;
};

const toOption = (
  option: Record<string, string | number | boolean>,
): Option => ({
  ...option,
  label: String(option.label ?? ""),
  value: String(option.value ?? ""),
});

const normalizeDate = (value?: string | Date | null) => {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const normalizeGrossWeight = (value?: string | null) =>
  (value ?? "").replace(/,/g, "").replace(/\s*kgs?$/gi, "").trim();

const getWeightInTons = (grossWeight?: string | null) =>
  Number(normalizeGrossWeight(grossWeight) || "0") * 0.001;

const getInitialContainerForm = (
  container: Omit<Container, "inventories">,
): ContainerUpdateForm => ({
  supplier_id: container.supplier.supplier_id,
  branch_id: container.branch.branch_id,
  barcode: container.barcode,
  bill_of_lading_number: container.bill_of_lading_number ?? "",
  container_number: container.container_number ?? "",
  gross_weight: normalizeGrossWeight(container.gross_weight),
  auction_or_sell: container.auction_or_sell,
  duties_and_taxes: Number(container.duties_and_taxes ?? 0),
});

const getSupplierOption = (container: Omit<Container, "inventories">): Option => ({
  label: container.supplier.name,
  value: container.supplier.supplier_id,
});

const getBranchOption = (container: Omit<Container, "inventories">): Option => ({
  label: container.branch.name,
  value: container.branch.branch_id,
});

const getOriginalComparableState = (
  container: Omit<Container, "inventories">,
): ComparableContainerState => ({
  ...getInitialContainerForm(container),
  arrival_date: normalizeDate(container.arrival_date),
});

export const UpdateContainerModal: React.FC<UpdateContainerModalProps> = ({
  container,
}) => {
  const router = useRouter();
  const [open, setOpenDialog] = useState<boolean>(false);
  const [newContainer, setNewContainer] = useState<ContainerUpdateForm>(() =>
    getInitialContainerForm(container),
  );
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(() =>
    container.arrival_date ? new Date(container.arrival_date) : undefined,
  );
  const [weightInTons, setWeightInTons] = useState<number>(() =>
    getWeightInTons(container.gross_weight),
  );
  const [suppliers, setSuppliers] = useState<Omit<Supplier, "containers">[]>(
    [],
  );
  const [selectedSupplier, setSelectedSupplier] = useState<Option | undefined>(
    () => getSupplierOption(container),
  );
  const [selectedBranch, setSelectedBranch] = useState<Option | undefined>(
    () => getBranchOption(container),
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();

  useEffect(() => {
    setNewContainer(getInitialContainerForm(container));
    setSelectedSupplier(getSupplierOption(container));
    setSelectedBranch(getBranchOption(container));
    setWeightInTons(getWeightInTons(container.gross_weight));
    setArrivalDate(
      container.arrival_date ? new Date(container.arrival_date) : undefined,
    );
    setErrors(undefined);
  }, [container]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const suppliers = await getSuppliers();
      const branches = await getBranches();
      if (suppliers.ok) setSuppliers(suppliers.value);
      if (branches.ok) setBranches(branches.value);
    };

    fetchInitialData();
  }, []);

  const originalState = getOriginalComparableState(container);
  const currentState: ComparableContainerState = {
    ...newContainer,
    supplier_id: selectedSupplier?.value ?? "",
    branch_id: selectedBranch?.value ?? "",
    gross_weight: normalizeGrossWeight(newContainer.gross_weight),
    duties_and_taxes: Number(newContainer.duties_and_taxes ?? 0),
    arrival_date: normalizeDate(arrivalDate),
  };

  const hasChanges = (
    Object.keys(originalState) as (keyof ComparableContainerState)[]
  ).some((key) => originalState[key] !== currentState[key]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasChanges) {
      return;
    }

    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.append("supplier_id", selectedSupplier?.value as string);
    formData.append("branch_id", selectedBranch?.value as string);
    formData.append(
      "arrival_date",
      arrivalDate ? arrivalDate.toISOString() : "",
    );
    const res = await updateContainer(container.container_id, formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated Container!");
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

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;
    setNewContainer((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Edit Container</Button>

      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Container</DialogTitle>
            <DialogDescription>Update Container</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="supplier" className="w-40">
                Supplier:
              </Label>

              <div className="w-full">
                {suppliers.length ? (
                  <SelectWithSearch
                    placeholder="Search Supplier"
                    defaultValue={selectedSupplier}
                    options={suppliers.map((supplier) => ({
                      label: `${supplier.name} (${supplier.supplier_code})`,
                      value: supplier.supplier_id,
                    }))}
                    setSelected={(supplier) =>
                      setSelectedSupplier(toOption(supplier))
                    }
                  />
                ) : (
                  <Skeleton className="w-full h-[36px]" />
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Label htmlFor="bidder_number" className="w-40">
                Branch:
              </Label>
              <div className="w-full">
                {branches.length ? (
                  <SelectWithSearch
                    placeholder="Search Branch"
                    defaultValue={selectedBranch}
                    options={branches.map((branch) => ({
                      label: branch.name,
                      value: branch.branch_id,
                    }))}
                    setSelected={(branch) =>
                      setSelectedBranch(toOption(branch))
                    }
                  />
                ) : (
                  <Skeleton className="w-full h-[36px]" />
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <Label className="w-40">Barcode</Label>
              <Input
                name="barcode"
                value={newContainer.barcode}
                onChange={handleUpdateChange}
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label className="w-40">Bill of Lading Number</Label>
              <Input
                name="bill_of_lading_number"
                value={newContainer.bill_of_lading_number}
                onChange={handleUpdateChange}
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label className="w-40">Container Number</Label>
              <Input
                name="container_number"
                value={newContainer.container_number}
                onChange={handleUpdateChange}
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label className="w-40">Auction Or Sell</Label>
              <Input
                name="auction_or_sell"
                value={newContainer.auction_or_sell}
                onChange={handleUpdateChange}
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <div className="flex gap-4">
                <Label className="w-50">Gross Weight</Label>
                <div className="w-full">
                  <InputNumber
                    className="w-full"
                    name="gross_weight"
                    suffix=" kgs"
                    hasStepper={false}
                    value={
                      newContainer.gross_weight
                        ? Number(newContainer.gross_weight)
                        : 0
                    }
                    onValueChange={(value) => {
                      setNewContainer((prev) => ({
                        ...prev,
                        gross_weight: value === undefined ? "" : String(value),
                      }));
                      setWeightInTons((value ?? 0) * 0.001);
                    }}
                    error={errors}
                  />
                </div>
              </div>

              <div>
                <InputNumber
                  value={weightInTons}
                  decimalScale={4}
                  readOnly
                  hasStepper={false}
                  suffix=" tons"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Label className="w-40">Duties and Taxes</Label>
              <div className="w-full">
                <InputNumber
                  name="duties_and_taxes"
                  value={newContainer.duties_and_taxes}
                  decimalScale={2}
                  onValueChange={(value) =>
                    setNewContainer((prev) => ({
                      ...prev,
                      duties_and_taxes: value ?? 0,
                    }))
                  }
                  hasStepper={false}
                  className="w-full"
                  error={errors}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Label className="w-40">Arrival Date</Label>
              <DatePicker
                id="arrival_date"
                name="arrival_date"
                date={arrivalDate}
                onChange={setArrivalDate}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant={"outline"}
                  onClick={() => setOpenDialog(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || !hasChanges}>
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
