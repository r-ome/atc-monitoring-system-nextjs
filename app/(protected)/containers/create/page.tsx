"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Loader2Icon } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { Label } from "@/app/components/ui/label";
import { getBranches } from "@/app/(protected)/branches/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Branch } from "src/entities/models/Branch";
import { getSuppliers } from "@/app/(protected)/suppliers/actions";
import { DatePicker } from "@/app/components/ui/datepicker";
import { Supplier } from "src/entities/models/Supplier";
import { SelectWithSearch } from "@/app/components/ui/SelectWithSearch";
import { format, addDays } from "date-fns";
import { createContainer } from "@/app/(protected)/containers/actions";

type option = Record<string, string | number | boolean>;

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>(
    undefined
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<option | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<option | null>(null);
  const [weightInTons, setWeightInTons] = useState<number>(0);
  const [departureDate, setDepartureDate] = useState<Date | undefined>(
    undefined
  );
  const [etaToPh, setEtaToPh] = useState<Date | undefined>(undefined);
  const [auctionStartDate, setAuctionStartDate] = useState<Date | undefined>(
    undefined
  );
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(undefined);

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
    if (isLoading) return;

    if (!selectedBranch || !selectedSupplier) {
      toast.error("Branch and Supplier");
      return;
    }

    const formData = new FormData(event.currentTarget);
    formData.append("supplier_id", selectedSupplier.value as string);
    formData.append("branch_id", selectedBranch.value as string);
    formData.append(
      "departure_date",
      departureDate ? departureDate.toISOString() : ""
    );
    formData.append("eta_to_ph", etaToPh ? etaToPh.toISOString() : "");
    formData.append(
      "arrival_date",
      arrivalDate ? arrivalDate.toISOString() : ""
    );
    formData.append("auction_or_sell", "AUCTION");
    setIsLoading(true);
    const res = await createContainer(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully created Container!");
        router.push(`/containers/${res.value?.barcode}`);
      }

      if (!res.ok) {
        toast.error(res.error.message);
        if (res.error.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        }
      }
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <h1 className="text-3xl">Create Container</h1>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="supplier">Supplier:</Label>

                  {suppliers.length ? (
                    <SelectWithSearch
                      placeholder="Search Supplier"
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

                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="branch">Branch:</Label>
                  {branches.length ? (
                    <SelectWithSearch
                      placeholder="Search Branch"
                      options={branches.map((branch) => ({
                        label: `${branch.name}`,
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
                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="bill_of_lading_number">
                    Bill of Lading Number:{" "}
                  </Label>
                  <Input
                    type="text"
                    id="bill_of_lading_number"
                    name="bill_of_lading_number"
                    error={errors}
                  />
                </div>

                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="container_number">Container Number: </Label>
                  <Input
                    type="text"
                    id="container_number"
                    name="container_number"
                    error={errors}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/3">
                  <Label htmlFor="barcode">Number of Shipment:</Label>
                  <InputNumber
                    id="barcode"
                    name="barcode"
                    required
                    error={errors}
                  />
                </div>
                <div className="flex flex-col gap-2 w-1/3">
                  <Label htmlFor="gross_weight">Gross Weight (KG): </Label>
                  <InputNumber
                    id="gross_weight"
                    name="gross_weight"
                    onChange={(e) =>
                      setWeightInTons(Number(e.target.value) * 0.001)
                    }
                    error={errors}
                  />
                </div>

                <div className="flex flex-col gap-2 w-1/3">
                  <Label htmlFor="gross_weight">Gross Weight (Tons): </Label>
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
                  <Label htmlFor="departure_date">
                    Departure date from Japan:{" "}
                  </Label>
                  <DatePicker
                    id="departure_date"
                    date={departureDate}
                    name="departure_date"
                    onChange={setDepartureDate}
                  />
                </div>

                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="birthdate">ETA to PH: </Label>
                  <DatePicker
                    id="eta_to_ph"
                    name="eta_to_ph"
                    date={etaToPh}
                    onChange={setEtaToPh}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="birthdate">Arrival Date: </Label>
                  <DatePicker
                    id="arrival_date"
                    name="arrival_date"
                    date={arrivalDate}
                    onChange={setArrivalDate}
                  />
                </div>

                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="due_date">Due Date: </Label>
                  <Input
                    disabled
                    value={
                      arrivalDate
                        ? format(addDays(arrivalDate, 40), "MMM dd, yyyy")
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="flex">
                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="birthdate">Auction Start Date: </Label>
                  <DatePicker
                    id="auction_start_date"
                    name="auction_start_date"
                    date={auctionStartDate}
                    onChange={setAuctionStartDate}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="space-x-2 w-1/2">
              <Button
                className="w-1/6 cursor-pointer"
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
              <Button
                className="w-1/6 cursor-pointer"
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => router.push("/bidders")}
              >
                Cancel
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
