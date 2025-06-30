"use client";

import { Supplier } from "src/entities/models/Supplier";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./suppliers-columns";
import { CoreRow } from "@tanstack/react-table";

export type SupplierRowType = Omit<Supplier, "containers">;

interface SuppliersTableProps {
  suppliers: SupplierRowType[];
}

export const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
}) => {
  const globalFilterFn = (
    row: CoreRow<SupplierRowType>,
    columnId?: string,
    filterValue?: string
  ) => {
    const name = (row.original as SupplierRowType).name.toLowerCase();
    const code = (row.original as SupplierRowType).supplier_code.toLowerCase();
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
