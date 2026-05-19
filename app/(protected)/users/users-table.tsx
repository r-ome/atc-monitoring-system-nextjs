"use client";

import { UsersRound } from "lucide-react";
import { User } from "src/entities/models/User";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { CoreRow, Row } from "@tanstack/react-table";
import { columns } from "./users-columns";
import { Badge } from "@/app/components/ui/badge";
import { BranchBadge } from "@/app/components/admin";

interface UsersTableProps {
  users: User[];
  onRowClick?: (user: User) => void;
}

export const UsersTable = ({ users, onRowClick }: UsersTableProps) => {
  const globalFilterFn = (
    row: CoreRow<User>,
    _?: string,
    filterValue?: string
  ) => {
    const name = (row.original as User).name.toLowerCase();
    const username = (row.original as User).username.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return name.includes(search) || username.includes(search);
  };

  const renderMobileCard = (row: Row<User>) => {
    const u = row.original;
    const initials = u.name
      .split(" ")
      .slice(0, 2)
      .map((s) => s[0])
      .join("");
    return (
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-accent-foreground">
          {initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-medium">{u.name}</span>
          <span className="font-mono text-[13px] text-muted-foreground">
            @{u.username}
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Badge>{u.role}</Badge>
          {u.branch?.name ? <BranchBadge branch={u.branch.name} /> : null}
        </div>
      </div>
    );
  };

  return (
    <AuctionDataTable
      icon={UsersRound}
      title="All Users"
      meta={`${users.length.toLocaleString()} total`}
      rowLabel="user"
      columns={columns}
      data={users}
      onRowClick={onRowClick}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search by name or username…",
        },
      }}
      renderMobileCard={renderMobileCard}
    />
  );
};
