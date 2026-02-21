"use client";

import { Loader2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadBidders } from "@/app/(protected)/bidders/actions";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Branch } from "src/entities/models/Branch";
import { getBranches } from "../../branches/actions";
import { Label } from "@/app/components/ui/label";

export const UploadBiddersModal: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const branch_res = await getBranches();
      if (branch_res.ok) {
        setBranches(branch_res.value);
      }
    };

    fetchInitialData();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);

    const res = await uploadBidders(formData);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully uploaded bidders!", {
          description:
            res.value +
            ". Please check the Manifest Page for more information.",
        });
        setOpen(false);
        router.refresh();
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
    <div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>Upload Bidders</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Bidders</DialogTitle>
            <DialogDescription>Upload bulk bidders</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <Label htmlFor="branch" className="w-40">
                Branch:
              </Label>
              <Select required name="branch_id">
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

            <Input
              id="file"
              name="file"
              type="file"
              className="cursor-pointer"
              required
              error={errors}
            />
            <DialogFooter>
              <DialogClose className="cursor-pointer">Cancel</DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
