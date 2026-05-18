"use client";

import { User } from "src/entities/models/User";
import { DataTable } from "@/app/components/data-table/data-table";
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
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground">
          {initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[13px] font-medium">{u.name}</span>
          <span className="font-mono text-[11px] text-muted-foreground">
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
    <DataTable
      columns={columns}
      data={users}
      onRowClick={onRowClick}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search By Name or Username",
        },
      }}
      renderMobileCard={renderMobileCard}
    />
  );
};
