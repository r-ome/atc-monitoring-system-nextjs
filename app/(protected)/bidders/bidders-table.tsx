"use client";

import { Bidder } from "src/entities/models/Bidder";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./bidder-columns";

export type BidderRowType = Omit<Bidder, "auctions_joined">;

interface BiddersTableProps {
  bidders: BidderRowType[];
}

export const BiddersTable = ({ bidders }: BiddersTableProps) => {
  const globalFilterFn = (
    row: CoreRow<BidderRowType>,
    columnId?: string,
    filterValue?: string
  ) => {
    const fullName = (row.original as BidderRowType).full_name.toLowerCase();
    const bidderNumber = (
      row.original as BidderRowType
    ).bidder_number.toLowerCase();
    const birthdate = (
      row.original as BidderRowType
    ).birthdate?.toLowerCase() as string;
    const search = (filterValue ?? "").toLowerCase();

    return [fullName, bidderNumber, birthdate]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  return (
    <DataTable
      columns={columns}
      data={bidders}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search By Name or Bidder Number",
        },
      }}
    />
  );
};
