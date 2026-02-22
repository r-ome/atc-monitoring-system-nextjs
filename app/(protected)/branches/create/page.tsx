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
import { createBranch } from "@/app/(protected)/branches/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>(
    undefined,
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const formData = new FormData(event.currentTarget);
    setIsLoading(true);
    const res = await createBranch(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully created Branch!");
        router.push(`/branches`);
      }

      if (!res.ok) {
        if (res.error?.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        } else {
          toast.error(res.error.message);
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
                <h1 className="text-3xl">Create Branch</h1>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2 w-3/6">
                    <Label htmlFor="name">Branch Name:</Label>
                    <Input id="name" name="name" required error={errors} />
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
    </>
  );
}
