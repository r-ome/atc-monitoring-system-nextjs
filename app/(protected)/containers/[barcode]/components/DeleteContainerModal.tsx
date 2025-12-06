"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Loader2Icon, Trash, TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import { Container } from "src/entities/models/Container";
import { deleteContainer } from "../../actions";
import { toast } from "sonner";

interface DeleteContainerModalProps {
  container: Omit<Container, "inventories"> & {
    inventories: Omit<
      Container["inventories"][number],
      "histories" | "auctions_inventory"
    >[];
  };
}

export const DeleteContainerModal: React.FC<DeleteContainerModalProps> = ({
  container,
}) => {
  const router = useRouter();
  const [open, setOpenDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    const res = await deleteContainer(container.container_id);

    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully deleted Container!");
        setOpenDialog(false);
        router.push(`/containers`);
      } else {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
        if (res.error.message === "Invalid Data!") {
          toast.error("Error!");
        }
      }
    }
  };

  return (
    <>
      <Button variant={"destructive"} onClick={() => setOpenDialog(true)}>
        <Trash />
        Delete Container
      </Button>

      <Dialog open={open}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <div className="flex gap-2 items-center">
                <TriangleAlert color="red" />
                Delete Container
              </div>
            </DialogTitle>
            <DialogDescription className="text-black">
              {container.inventories.length
                ? `Container already has ${container.inventories.length} items. It cannot be deleted.`
                : "Are you sure you want to delete this container?"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-2">
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  variant={"outline"}
                  onClick={() => setOpenDialog(false)}
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                variant={"destructive"}
                disabled={isLoading || !!container.inventories.length}
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                Delete Container
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
