"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/registered-bidders-columns";
import type { RegisteredBidderSummary } from "src/entities/models/Bidder";

interface RegisteredBiddersSummaryProps {
  registeredBidders: RegisteredBidderSummary[];
}

export const RegisteredBiddersTable = ({
  registeredBidders,
}: RegisteredBiddersSummaryProps) => {
  const router = useRouter();
  const globalFilterFn = (
    row: CoreRow<RegisteredBidderSummary>,
    columnId?: string,
    filterValue?: string
  ) => {
    const fullName = (
      row.original as RegisteredBidderSummary
    ).bidder.full_name.toLowerCase();
    const bidderNumber = (
      row.original as RegisteredBidderSummary
    ).bidder.bidder_number.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return fullName.includes(search) || bidderNumber.includes(search);
  };

  return (
    <DataTable
      columns={columns}
      data={registeredBidders}
      initialSorting={[{ id: "created_at", desc: false }]}
      onRowClick={(registeredBidder) =>
        router.push(
          `registered-bidders/${registeredBidder.bidder.bidder_number}`
        )
      }
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search By Name or Bidder Number",
        },
      }}
    />
  );
};
