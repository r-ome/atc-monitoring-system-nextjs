"use client";

import { useState } from "react";
import { User } from "src/entities/models/User";
import { UsersTable } from "./users-table";
import { UserProfileModal } from "./UserProfileModal";

interface UsersListProps {
  users: User[];
}

export const UsersList = ({ users }: UsersListProps) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <>
      <UsersTable
        users={users}
        onRowClick={(user) => {
          setSelectedUser(user);
          setOpen(true);
        }}
      />

      <UserProfileModal
        user={selectedUser}
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setSelectedUser(null);
          }
        }}
      />
    </>
  );
};
