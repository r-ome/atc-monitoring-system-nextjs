"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./bought-items-columns";
import { BoughtItems } from "src/entities/models/Inventory";

interface BoughtItemsTableProps {
  boughtItems: BoughtItems[];
}

export const BoughtItemsTable = ({ boughtItems }: BoughtItemsTableProps) => {
  const globalFilterFn = (
    row: CoreRow<BoughtItems>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { barcode, control, description, new_price } = row.original;

    return [barcode, control, description, new_price]
      .filter(Boolean)
      .some((field) => field!.toString().toLowerCase().includes(search));
  };

  return (
    <DataTable
      columns={columns}
      data={boughtItems}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search item here",
        },
      }}
    />
  );
};
