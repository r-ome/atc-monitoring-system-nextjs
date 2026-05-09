"use client";

import { User } from "src/entities/models/User";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./users-columns";

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
    />
  );
};
