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
import { createPaymentMethod } from "../actions";

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
    formData.append("state", "ENABLED");

    setIsLoading(true);
    const res = await createPaymentMethod(formData);
    setIsLoading(false);

    if (res.ok) {
      toast.success("Successfully created Payment Method!");
      router.push(`/configurations/payment-methods`);
    } else {
      const description =
        typeof res.error?.cause === "string" ? res.error?.cause : null;
      toast.error(res.error.message, { description });
      if (res.error.message === "Invalid Data!") {
        setErrors(res.error.cause as Record<string, string[]>);
      }
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit}>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>
              <h1 className="text-3xl">Create Payment Method</h1>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/3">
                  <Label htmlFor="name">Payment Method Name:</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    error={errors}
                    required
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
                onClick={() => router.push("/configurations/payment-methods")}
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
