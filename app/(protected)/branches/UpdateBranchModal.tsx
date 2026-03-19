"use client";

import { Loader2Icon } from "lucide-react";
import { useState } from "react";
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateBranchModal: React.FC<UpdateBranchModalProps> = ({
  branch,
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [name, setName] = useState<string>(branch.name);
  const [errors, setErrors] = useState<Record<string, string[]>>();

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    setErrors(undefined);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const formData = new FormData(event.currentTarget);

    try {
      const res = await updateBranch(branch.branch_id, formData);

      if (res.ok) {
        toast.success("Successfully updated branch!");
        onOpenChange(false);
        router.refresh();
      } else {
        if (res.error.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        } else {
          toast.error(res.error.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors}
              required
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
