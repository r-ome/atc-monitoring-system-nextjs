"use client";

import React, { useState } from "react";
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
import { Label } from "@/app/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createSupplier } from "../actions";

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>(
    undefined
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const formData = new FormData(event.currentTarget);
    setIsLoading(true);
    const res = await createSupplier(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully created Supplier!");
        router.push(`/suppliers`);
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

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <h1 className="text-3xl">Create Supplier</h1>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-3/6">
                  <Label htmlFor="name">Supplier Name:</Label>
                  <Input id="name" name="name" required error={errors} />
                </div>

                <div className="flex flex-col gap-2 w-3/6">
                  <Label htmlFor="japanese_name">Japanese Name:</Label>
                  <Input
                    id="japanese_name"
                    name="japanese_name"
                    error={errors}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-3/6">
                  <Label htmlFor="supplier_code">Supplier Code:</Label>
                  <Input
                    id="supplier_code"
                    name="supplier_code"
                    required
                    error={errors}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-3/6">
                  <Label htmlFor="commission">Commission:</Label>
                  <Input id="commission" name="commission" error={errors} />
                </div>

                <div className="flex flex-col gap-2 w-3/6">
                  <Label htmlFor="sales_remittance_account">
                    Sales Remittance Account:
                  </Label>
                  <Input
                    id="sales_remittance_account"
                    name="sales_remittance_account"
                    error={errors}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-2/6">
                  <Label htmlFor="shipper">Shipper:</Label>
                  <Input id="shipper" name="shipper" error={errors} />
                </div>

                <div className="flex flex-col gap-2 w-2/6">
                  <Label htmlFor="email">Email:</Label>
                  <Input id="email" name="email" error={errors} />
                </div>

                <div className="flex flex-col gap-2 w-2/6">
                  <Label htmlFor="contact_number">Contact Number:</Label>
                  <Input
                    id="contact_number"
                    name="contact_number"
                    error={errors}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <div className="space-x-2 w-1/2">
              <Button
                className="w-fit cursor-pointer"
                type="submit"
                disabled={isLoading}
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
              <Button
                className="w-fit cursor-pointer"
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => router.push("/branches")}
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
