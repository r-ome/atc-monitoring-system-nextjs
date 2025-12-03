"use client";

import { useRouter, redirect } from "next/navigation";
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
  supplier_id?: string;
  branch_id?: string;
  barcode?: string;
  bill_of_lading_number?: string;
  gross_weight?: string;
  container_number?: string;
  auction_or_sell?: "AUCTION" | "SELL";
  arrival_date?: Date;
  due_date?: Date;
  auction_end_date?: Date;
};

type Option = Record<string, string | number | boolean>;

export const UpdateContainerModal: React.FC<UpdateContainerModalProps> = ({
  container,
}) => {
  const router = useRouter();
  const [open, setOpenDialog] = useState<boolean>(false);
  const [newContainer, setNewContainer] = useState<ContainerUpdateForm>({});
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>();
  const [etaToPh, setEtaToPh] = useState<Date | undefined>();
  const [departureDate, setDepartureDate] = useState<Date | undefined>();
  const [auctionStartDate, setAuctionStartDate] = useState<Date | undefined>();
  const [auctionEndDate, setAuctionEndDate] = useState<Date | undefined>();
  const [weightInTons, setWeightInTons] = useState<number>(0);
  const [suppliers, setSuppliers] = useState<Omit<Supplier, "containers">[]>(
    []
  );
  const [selectedSupplier, setSelectedSupplier] = useState<Option | undefined>({
    label: container.supplier.name,
    value: container.supplier.supplier_id,
  });
  const [selectedBranch, setSelectedBranch] = useState<Option | undefined>({
    label: container.branch.name,
    value: container.branch.branch_id,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();

  useEffect(() => {
    setNewContainer({
      supplier_id: container.supplier.supplier_id,
      branch_id: container.branch.branch_id,
      barcode: container.barcode,
      bill_of_lading_number: container.bill_of_lading_number,
      container_number: container.container_number,
      gross_weight: container.gross_weight,
      auction_or_sell: container.auction_or_sell,
      due_date: container.due_date ? new Date(container.due_date) : undefined,
      auction_end_date: container.auction_end_date
        ? new Date(container.auction_end_date)
        : undefined,
    });

    if (container.arrival_date) {
      setArrivalDate(new Date(container.arrival_date));
    }

    if (container.auction_end_date) {
      setAuctionEndDate(new Date(container.auction_end_date));
    }
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.append("supplier_id", selectedSupplier?.value as string);
    formData.append("branch_id", selectedBranch?.value as string);
    const res = await updateContainer(container.container_id, formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated Container!");
        router.refresh();
        setOpenDialog(false);
        redirect(`${res.value.barcode}`);
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
                    defaultValue={
                      selectedSupplier as { label: string; value: string }
                    }
                    options={suppliers.map((supplier) => ({
                      label: `${supplier.name} (${supplier.supplier_code})`,
                      value: supplier.supplier_id,
                    }))}
                    setSelected={(supplier) => setSelectedSupplier(supplier)}
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
                    defaultValue={
                      selectedBranch as { label: string; value: string }
                    }
                    options={branches.map((branch) => ({
                      label: branch.name,
                      value: branch.branch_id,
                    }))}
                    setSelected={setSelectedBranch}
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
                        ? parseInt(newContainer.gross_weight, 10)
                        : 0
                    }
                    onChange={(event) => {
                      handleUpdateChange(event);
                      setWeightInTons(
                        Number(event.target.value.replace(/ kgs/gi, "")) * 0.001
                      );
                    }}
                    error={errors}
                  />
                </div>
              </div>

              <div>
                <InputNumber
                  value={weightInTons}
                  decimalScale={4}
                  disabled
                  hasStepper={false}
                  suffix=" tons"
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
            <div className="flex gap-4">
              <Label className="w-40">Auction End Date</Label>
              <DatePicker
                id="auction_end_date"
                name="auction_end_date"
                date={auctionEndDate}
                onChange={setAuctionEndDate}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant={"outline"}
                  onClick={() => setOpenDialog(false)}
                >
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
