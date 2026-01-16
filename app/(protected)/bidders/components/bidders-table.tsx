"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./bidder-columns";

export type BidderRowType = {
  bidder_id: string;
  bidder_number: string;
  full_name: string;
  birthdate: string | null;
  last_active: {
    duration: string | null;
    auction: string | null;
  };
  status: string;
  branch: {
    branch_id: string;
    name: string;
  };
};

interface BiddersTableProps {
  bidders: BidderRowType[];
}

export const BiddersTable = ({ bidders }: BiddersTableProps) => {
  const router = useRouter();
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
      onRowClick={(bidder) =>
        router.push(`/bidders/${bidder.bidder_number}-${bidder.branch.name}`)
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
