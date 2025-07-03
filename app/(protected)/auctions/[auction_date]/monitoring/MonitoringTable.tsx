"use client";

import { AuctionsInventory } from "src/entities/models/Auction";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./monitoring-columns";

interface MonitoringTableProps {
  monitoring: AuctionsInventory[];
}

export const MonitoringTable = ({ monitoring }: MonitoringTableProps) => {
  const globalFilterFn = (
    row: CoreRow<AuctionsInventory>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { description, qty, price, manifest_number, inventory, status } =
      row.original;
    const { barcode, control } = inventory;
    const { bidder_number } = row.original.bidder;

    return [
      barcode,
      bidder_number,
      control,
      qty,
      description,
      price.toString(),
      manifest_number,
      status,
    ]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  return (
    <DataTable
      columns={columns}
      data={monitoring}
      columnFilter={{
        column: "status",
        options: [
          { label: "PAID", value: "PAID" },
          { label: "UNPAID", value: "UNPAID" },
          { label: "CANCELLED", value: "CANCELLED" },
        ],
        filterComponentProps: { placeholder: "Filter By Status" },
      }}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search item here",
        },
      }}
    />
  );
};
