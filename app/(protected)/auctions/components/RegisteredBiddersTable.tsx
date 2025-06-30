"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/registered-bidders-columns";
import { RegisteredBidder } from "src/entities/models/Bidder";

interface RegisteredBiddersProps {
  registeredBidders: RegisteredBidder[];
}

export const RegisteredBiddersTable = ({
  registeredBidders,
}: RegisteredBiddersProps) => {
  const globalFilterFn = (
    row: CoreRow<RegisteredBidder>,
    columnId?: string,
    filterValue?: string
  ) => {
    const fullName = (
      row.original as RegisteredBidder
    ).bidder.full_name.toLowerCase();
    const bidderNumber = (
      row.original as RegisteredBidder
    ).bidder.bidder_number.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return fullName.includes(search) || bidderNumber.includes(search);
  };

  return (
    <DataTable
      columns={columns}
      data={registeredBidders}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search By Name or Bidder Number",
        },
      }}
    />
  );
};
