"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { BranchBadge } from "@/app/components/admin";
import { User } from "src/entities/models/User";
import { UpdateUserModal } from "./[username]/UpdateUserModal";
import { UpdateUserPasswordModal } from "./[username]/UpdateUserPasswordModal";
import { DeleteUserModal } from "./[username]/DeleteUserModal";

interface UserProfileModalProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserProfileModal = ({
  user,
  open,
  onOpenChange,
}: UserProfileModalProps) => {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        {currentUser ? (
          <>
            <DialogHeader>
              <DialogTitle>
                <div className="flex items-center gap-2">
                  <span>{currentUser.name}</span>
                  <Badge>{currentUser.role}</Badge>
                </div>
              </DialogTitle>
              <DialogDescription>
                <div>{currentUser.username}</div>
                <BranchBadge branch={currentUser.branch.name} />
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono text-xs">{currentUser.user_id}</span>
              </div>
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-muted-foreground">Created</span>
                <span>{currentUser.created_at}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{currentUser.updated_at}</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <UpdateUserModal user={currentUser} onUpdated={setCurrentUser} />
              <UpdateUserPasswordModal user={currentUser} />
              <DeleteUserModal
                user={currentUser}
                onDeleted={() => {
                  onOpenChange(false);
                  router.refresh();
                }}
              />
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
