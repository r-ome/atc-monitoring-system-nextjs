"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Loader2Icon } from "lucide-react";
import { DatePicker } from "@/app/components/ui/datepicker";
import { Input } from "@/app/components/ui/input";
import { Skeleton } from "@/app/components/ui/skeleton";
import { InputNumber } from "@/app/components/ui/InputNumber";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Label } from "@/app/components/ui/label";
import { createBidder } from "@/app/(protected)/bidders/actions";
import { getBranches } from "@/app/(protected)/branches/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Branch } from "src/entities/models/Branch";

export default function Page() {
  const router = useRouter();
  const session = useSession();
  const [birthdate, setBirthdate] = useState<Date>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>(
    undefined
  );
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranchesData = async () => {
      const branches = await getBranches();
      if (branches.ok) setBranches(branches.value);
    };

    fetchBranchesData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const formData = new FormData(event.currentTarget);
    const serviceCharge = formData
      .get("service_charge")
      ?.toString()
      .replace(/%/gi, "");
    const registrationFee = formData
      .get("registration_fee")
      ?.toString()
      .replace(/,/gi, "");

    setIsLoading(true);
    formData.append("status", "ACTIVE");
    if (registrationFee) {
      formData.set("registration_fee", registrationFee);
    }
    if (serviceCharge) {
      formData.set("service_charge", serviceCharge);
    }
    if (birthdate) {
      formData.set("birthdate", birthdate.toISOString());
    }

    const res = await createBidder(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully created Bidder!");
        router.push(`/bidders/${res.value.bidder_number}`);
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

  if (!session) {
    return <div></div>;
  }

  const user = session.data?.user;

  return (
    <>
      <div className="p-4">
        <form onSubmit={handleSubmit}>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <h1 className="text-3xl">Create Bidder</h1>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="bidder_number">Bidder Number:</Label>
                    <InputNumber
                      id="bidder_number"
                      name="bidder_number"
                      required
                      error={errors}
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="bidder_number">Status:</Label>
                    <Select disabled defaultValue="ACTIVE">
                      <SelectTrigger className="w-[180px] text-foreground">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent defaultValue={"ACTIVE"}>
                        {["ACTIVE", "INACTIVE", "BANNED"].map((item) => (
                          <SelectItem value={item} key={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="first_name">First Name: </Label>
                    <Input
                      type="text"
                      id="first_name"
                      name="first_name"
                      error={errors}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="middle_name">Middle Name: </Label>
                    <Input type="text" id="middle_name" name="middle_name" />
                  </div>
                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="last_name">Last Name: </Label>
                    <Input
                      type="text"
                      id="last_name"
                      name="last_name"
                      error={errors}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="birthdate">Birth Date: </Label>
                    <DatePicker
                      id="birthdate"
                      name="birthdate"
                      date={birthdate}
                      onChange={setBirthdate}
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="contact_number">Contact Number: </Label>
                    <Input id="contact_number" name="contact_number" required />
                  </div>

                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="tin_number">TIN Number: </Label>
                    <Input id="tin_number" name="tin_number" required />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="address">Address: </Label>
                    <Input id="address" name="address" required />
                  </div>

                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="store_name">Store Name: </Label>
                    <Input id="store_name" name="store_name" />
                  </div>

                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="payment_term">Payment Term: </Label>
                    <InputNumber
                      id="payment_term"
                      name="payment_term"
                      defaultValue={7}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="registration_fee">Registration Fee: </Label>
                    <InputNumber
                      id="registration_fee"
                      name="registration_fee"
                      defaultValue={3000}
                      thousandSeparator=","
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="service_charge">Service Charge: </Label>
                    <InputNumber
                      id="service_charge"
                      name="service_charge"
                      suffix="%"
                      defaultValue={12}
                      required
                    />
                  </div>

                  {["OWNER", "SUPER_ADMIN"].includes(user?.role ?? "") ? (
                    <div className="flex flex-col gap-2 w-1/3">
                      <Label htmlFor="branch_id">Branch:</Label>
                      {branches.length ? (
                        <Select defaultValue="BIÑAN" name="branch_id">
                          <SelectTrigger className="w-[180px] text-foreground">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches.map((branch) => (
                              <SelectItem
                                value={branch.branch_id}
                                key={branch.branch_id}
                              >
                                {branch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Skeleton className="w-[180px] h-10" />
                      )}
                    </div>
                  ) : null}
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
    </>
  );
}
