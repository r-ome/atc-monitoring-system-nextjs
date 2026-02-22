"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Branch } from "src/entities/models/Branch";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import { updateBranch } from "@/app/(protected)/branches/actions";

interface UpdateBranchModalProps {
  branch: Branch;
}

type UpdateBranchForm = {
  name?: string;
};

export const UpdateBranchModal: React.FC<UpdateBranchModalProps> = ({
  branch,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpenDialog] = useState<boolean>(false);
  const [newBranch, setNewBranch] = useState<UpdateBranchForm>();
  const [errors, setErrors] = useState<Record<string, string[]>>();

  useEffect(() => {
    setNewBranch({ name: branch.name });
  }, [branch]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);

    const res = await updateBranch(branch.branch_id, formData);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully updated branch!");
        setOpenDialog(false);
        router.push(`/branches/${res.value.name}`);
      }

      if (!res.ok) {
        if (res.error.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        } else {
          toast.error(res.error.message);
        }
      }
    }
  };

  return (
    <>
      <Button onClick={() => setOpenDialog(true)}>Edit Branch</Button>

      <Dialog
        open={open}
        onOpenChange={() => {
          setOpenDialog(!open);
          setErrors(undefined);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Branch</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex">
              <Label htmlFor="name" className="w-40">
                Branch Name
              </Label>
              <Input
                name="name"
                value={newBranch?.name}
                onChange={(e) =>
                  setNewBranch((prev) => ({
                    ...prev,
                    [e.target.name]: e.target.value,
                  }))
                }
                error={errors}
                required
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
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
