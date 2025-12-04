"use client";

import { Loader2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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
import { Input } from "@/app/components/ui/input";
import { updateUser } from "@/app/(protected)/users/actions";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/app/components/ui/select";
import { User } from "src/entities/models/User";
import { getBranches } from "../../branches/actions";
import { Branch } from "src/entities/models/Branch";

type UpdateUserForm = {
  name?: string;
  username?: string;
  password?: string;
  branch_id?: string;
};

interface UpdateUserModalProps {
  user: User;
}

export const UpdateUserModal: React.FC<UpdateUserModalProps> = ({ user }) => {
  const router = useRouter();
  const session = useSession();

  const [open, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [newUser, setNewUser] = useState<UpdateUserForm>(user);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [branches, setBranches] = useState<Branch[]>([]);

  const loggedInUser = session?.data;

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getBranches();

      if (!res.ok) return;

      setBranches(res.value);
    };

    fetchInitialData();
  }, []);

  if (!session || !loggedInUser) {
    return <div></div>;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);

    const res = await updateUser(user.user_id, formData);
    const username = formData.get("username");

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated user!");
        router.push(`/users/${username}`);
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

  const handleUpdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const name = e.target.name;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  console.log(["OWNER", "SUPER_ADMIN"].includes(loggedInUser?.user.role));

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Edit User</Button>

      <Dialog open={open} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User</DialogTitle>
            <DialogDescription>Update User details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex gap-4">
              <Label htmlFor="name" className="w-40">
                Name
              </Label>
              <Input
                name="name"
                value={newUser?.name}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="username" className="w-40">
                Username
              </Label>
              <Input
                name="username"
                value={newUser?.username}
                onChange={handleUpdateChange}
                required
                error={errors}
              />
            </div>

            <div className="flex gap-4">
              <Label htmlFor="branch" className="w-40">
                Branch:
              </Label>
              <div className="w-full">
                <Select
                  required
                  name="branch_id"
                  defaultValue={user.branch?.branch_id}
                  disabled={
                    !["OWNER", "SUPER_ADMIN"].includes(loggedInUser?.user.role)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Branch"></SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {branches.map((item) => (
                        <SelectItem key={item.branch_id} value={item.branch_id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-4">
              <Label htmlFor="roles" className="w-40">
                Roles:
              </Label>
              <Select
                required
                name="role"
                defaultValue={user.role}
                disabled={
                  !["OWNER", "SUPER_ADMIN"].includes(loggedInUser?.user.role)
                }
              >
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

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
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
