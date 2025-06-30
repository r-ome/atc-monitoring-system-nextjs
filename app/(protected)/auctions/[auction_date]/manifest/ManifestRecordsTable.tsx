"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./manifest-columns";
import { Manifest } from "src/entities/models/Manifest";

interface ManifestRecordsTableProps {
  manifestRecords: Manifest[];
}

export const ManifestRecordsTable = ({
  manifestRecords,
}: ManifestRecordsTableProps) => {
  const globalFilterFn = (
    row: CoreRow<Manifest>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const {
      bidder_number,
      barcode,
      control,
      description,
      price,
      manifest_number,
    } = row.original;

    return [
      bidder_number,
      barcode,
      control,
      description,
      manifest_number,
      price,
    ]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  return (
    <DataTable
      columns={columns}
      data={manifestRecords}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search item here",
        },
      }}
    />
  );
};
