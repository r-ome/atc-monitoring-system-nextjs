"use client";

import { CoreRow } from "@tanstack/react-table";
import { Container } from "src/entities/models/Container";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./container-columns";
import { Inventory } from "src/entities/models/Inventory";

export type ContainerRowType = Omit<Container, "inventories"> & {
  inventories: Omit<Inventory, "histories" | "auctions_inventory">[];
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
