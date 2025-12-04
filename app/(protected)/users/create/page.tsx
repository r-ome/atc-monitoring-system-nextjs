"use client";

import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { PasswordInput } from "@/app/components/ui/input-password";
import { registerUser } from "@/app/(protected)/users/actions";
import { toast } from "sonner";
import { getBranches } from "@/app/(protected)/branches/actions";
import { Branch } from "src/entities/models/Branch";

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string[]> | undefined>(
    undefined
  );
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getBranches();
      if (!res.ok) return;

      setBranches(res.value);
    };

    fetchInitialData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);
    const res = await registerUser(formData);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully registered user!");
        router.push("/users");
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
              <h1 className="text-3xl">Register User</h1>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="roles">Roles:</Label>
                  <Select required name="role">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select User Role"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {["CASHIER", "ENCODER"].map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="branch">Branch:</Label>
                  <Select required name="branch_id">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Branch"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {branches.map((item) => (
                          <SelectItem
                            key={item.branch_id}
                            value={item.branch_id}
                          >
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    type="text"
                    id="username"
                    name="username"
                    error={errors}
                  />
                </div>

                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="name">Employee Name:</Label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    required
                    error={errors}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="password">Password:</Label>
                  <PasswordInput
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    error={errors}
                  />
                </div>

                <div className="flex flex-col gap-2 w-1/2">
                  <Label htmlFor="password">Confirm Password:</Label>
                  <PasswordInput
                    name="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                disabled={isLoading || password !== confirmPassword}
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
              <Button
                className="w-1/6 cursor-pointer"
                type="button"
                variant="secondary"
                disabled={isLoading}
                onClick={() => router.push("/users")}
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
