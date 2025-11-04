"use client";

import { useState } from "react";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./manifest-columns";
import { Manifest } from "src/entities/models/Manifest";
import { UpdateManifestModal } from "./UpdateManifestModal";

interface ManifestRecordsTableProps {
  manifestRecords: Manifest[];
}

export const ManifestRecordsTable = ({
  manifestRecords,
}: ManifestRecordsTableProps) => {
  const [selected, setSelected] = useState<Manifest>({
    manifest_id: "",
    barcode: "",
    control: "",
    description: "",
    price: "",
    bidder_number: "",
    qty: "",
    manifest_number: "",
  } as Manifest);
  const [open, setOpen] = useState<boolean>(false);

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
    <>
      <UpdateManifestModal open={open} setOpen={setOpen} selected={selected} />
      <DataTable
        columns={columns(setOpen, setSelected)}
        data={manifestRecords}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search item here",
          },
        }}
      />
    </>
  );
};
