"use client";

import { CoreRow } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./container-columns";

export type ContainerRowType = {
  container_id: string;
  barcode: string;
  supplier_id: string;
  branch_id: string;
  bill_of_lading_number: string;
  container_number: string;
  gross_weight: string;
  auction_or_sell: string;
  status: string;
  paid_at: string | null;
  duties_and_taxes: number;
  branch: { branch_id: string; name: string };
  supplier: { supplier_id: string; supplier_code: string; name: string };
  arrival_date?: string;
  auction_start_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  inventory_count: number;
};

interface ContainersTableProps {
  containers: ContainerRowType[];
}

export const ContainersTable: React.FC<ContainersTableProps> = ({
  containers,
}) => {
  const globalFilterFn = (
    row: CoreRow<ContainerRowType>,
    columnId?: string,
    filterValue?: string
  ) => {
    const barcode = (row.original as ContainerRowType).barcode.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return barcode.includes(search);
  };

  return (
    <DataTable
      columns={columns}
      data={containers}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search By Barcode",
        },
      }}
    />
  );
};
