"use client";

import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardTitle,
  CardDescription,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { PasswordInput } from "@/app/components/ui/input-password";
import { Label } from "@/app/components/ui/label";
import { signIn } from "next-auth/react";
import { toast } from "sonner";

export default function Page() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const res = await signIn("credentials", {
      redirect: false,
      username: data.username,
      password: data.password,
    });
    if (res) {
      setIsLoading(false);
      if (res?.ok) {
        router.push("/auctions");
      } else {
        if (res?.error === "CredentialsSignin") {
          toast.error("The password you've entered is incorrect!");
        }
      }
    }
  };

  return (
    <div className="flex w-screen h-screen justify-center items-center overflow-hidden">
      <Card>
        <CardHeader>
          <CardTitle>Login Page</CardTitle>
          <CardDescription>Please enter your credentials here</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="username" className="w-40">
                Username:
              </Label>
              <Input name="username" />
            </div>

            <div className="flex gap-4">
              <Label htmlFor="password" className="w-40">
                Password:
              </Label>
              <div className="w-full">
                <PasswordInput
                  value={password}
                  name="password"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <CardFooter>
              <div className="flex justify-center w-full">
                <Button type="submit" className="w-2/6" disabled={isLoading}>
                  {isLoading && <Loader2Icon className="animate-spin" />}
                  Login
                </Button>
              </div>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
