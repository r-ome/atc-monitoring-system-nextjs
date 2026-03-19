"use client";

import { CoreRow } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { supplierContainerColumns } from "./supplier-containers-columns";

export type SupplierContainerRow = {
  container_id: string;
  barcode: string;
  inventories: unknown[];
  sold_items: number;
  unsold_items: number;
  branch: { name: string };
  arrival_date: Date | null;
  due_date: Date | null;
};

interface SupplierContainersTableProps {
  containers: SupplierContainerRow[];
}

const globalFilterFn = (
  row: CoreRow<SupplierContainerRow>,
  _columnId?: string,
  filterValue?: string
) => {
  const barcode = row.original.barcode.toLowerCase();
  const search = (filterValue ?? "").toLowerCase();
  return barcode.includes(search);
};

export const SupplierContainersTable: React.FC<
  SupplierContainersTableProps
> = ({ containers }) => {
  return (
    <DataTable
      columns={supplierContainerColumns}
      data={containers}
      getRowId={(row) => row.container_id}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: { placeholder: "Search by Barcode" },
      }}
    />
  );
};
