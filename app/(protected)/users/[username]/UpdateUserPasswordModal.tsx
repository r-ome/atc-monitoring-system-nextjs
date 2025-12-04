"use client";

import { Loader2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { updateUserPassword } from "@/app/(protected)/users/actions";
import { User } from "src/entities/models/User";
import { PasswordInput } from "@/app/components/ui/input-password";

interface UpdateUserPasswordModalProps {
  user: User;
}

export const UpdateUserPasswordModal: React.FC<
  UpdateUserPasswordModalProps
> = ({ user }) => {
  const router = useRouter();
  const session = useSession();

  const loggedInUser = session?.data;

  if (!session || !loggedInUser) {
    router.push("/login");
  }

  const [open, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [password, setPassword] = useState<string>("");
  const [isMatch, setIsMatch] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);

    const res = await updateUserPassword(user.user_id, formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated user password!");
        router.refresh();
        setOpenDialog(false);
      } else {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
        if (res.error.message === "Invalid Data!") {
          toast.error(res.error.message);
          setErrors(res.error.cause as Record<string, string[]>);
        }
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Edit Password</Button>

      <Dialog open={open} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Password</DialogTitle>
            <DialogDescription>Update User Password</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="password" className="w-40">
                New Password
              </Label>
              <PasswordInput
                name="password"
                onChange={(e) => setPassword(e.target.value)}
                required
                error={errors}
              />
            </div>

            <div className="flex gap-4">
              <Label htmlFor="new_password" className="w-40">
                Confirm New Password
              </Label>
              <PasswordInput
                name="new_password"
                onChange={(e) => setIsMatch(e.target.value === password)}
                required
                error={errors}
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || !isMatch}>
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
