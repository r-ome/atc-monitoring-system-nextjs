"use client";

import { User } from "src/entities/models/User";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./users-columns";

interface UsersTableProps {
  users: User[];
}

export const UsersTable = ({ users }: UsersTableProps) => {
  const globalFilterFn = (
    row: CoreRow<User>,
    columnId?: string,
    filterValue?: string
  ) => {
    const name = (row.original as User).name.toLowerCase();
    const username = (row.original as User).name.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return name.includes(search) || username.includes(search);
  };

  return (
    <DataTable
      columns={columns}
      data={users}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search By Name or Bidder Number",
        },
      }}
    />
  );
};
