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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
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
    setIsLoading(true);
    formData.append("state", "ENABLED");

    setIsLoading(false);
    const res = await createPaymentMethod(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully created Payment Method!");
        router.push(`/configurations/payment-methods`);
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
    <>
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
                    <Label htmlFor="name">Payment Method Name: </Label>
                    <Input
                      type="text"
                      id="name"
                      name="name"
                      error={errors}
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-1/3">
                    <Label htmlFor="state">State:</Label>
                    <Select disabled defaultValue="ENABLED">
                      <SelectTrigger className="w-[180px] text-foreground">
                        <SelectValue placeholder="State" />
                      </SelectTrigger>
                      <SelectContent defaultValue={"ENABLED"}>
                        {["ENABLED", "DISABLED"].map((item) => (
                          <SelectItem value={item} key={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
    </>
  );
}
