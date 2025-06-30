"use client";

import { Supplier } from "src/entities/models/Supplier";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./suppliers-columns";
import { CoreRow } from "@tanstack/react-table";

interface SuppliersTableProps {
  suppliers: Supplier[];
}

export const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
}) => {
  const globalFilterFn = (
    row: CoreRow<Supplier>,
    columnId?: string,
    filterValue?: string
  ) => {
    const name = (row.original as Supplier).name.toLowerCase();
    const code = (row.original as Supplier).supplier_code.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return name.includes(search) || code.includes(search);
  };

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: { placeholder: "Search By Name or Code" },
      }}
    />
  );
};
