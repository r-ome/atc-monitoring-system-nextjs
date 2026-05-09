"use client";

import { Loader2Icon, Trash2Icon } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { User } from "src/entities/models/User";
import { deleteUser } from "@/app/(protected)/users/actions";

interface DeleteUserModalProps {
  user: User;
  onDeleted?: () => void;
}

export const DeleteUserModal = ({ user, onDeleted }: DeleteUserModalProps) => {
  const router = useRouter();
  const session = useSession();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loggedInUser = session.data?.user;
  const canDelete = ["OWNER", "SUPER_ADMIN"].includes(loggedInUser?.role ?? "");
  const isSelf = loggedInUser?.id === user.user_id;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await deleteUser(user.user_id);

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error.cause : null;
        toast.error(res.error.message, { description });
        return;
      }

      toast.success(`Deleted user ${user.username}.`);
      setOpen(false);
      onDeleted?.();
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="destructive"
        onClick={() => setOpen(true)}
        disabled={!canDelete || isSelf}
      >
        <Trash2Icon />
        Remove User
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remove User</DialogTitle>
          <DialogDescription>
            This will permanently delete {user.name} ({user.username}) from the
            database.
          </DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          {isSelf
            ? "You cannot delete your own account."
            : "This action cannot be undone."}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading || isSelf}
          >
            {isLoading ? <Loader2Icon className="animate-spin" /> : null}
            Remove User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
