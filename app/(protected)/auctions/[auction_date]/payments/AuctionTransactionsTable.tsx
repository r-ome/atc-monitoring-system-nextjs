"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./transactions-columns";
import { AuctionTransaction } from "src/entities/models/Payment";

interface AuctionTransactionsTableProps {
  transactions: AuctionTransaction[];
}

export const AuctionTransactionsTable = ({
  transactions,
}: AuctionTransactionsTableProps) => {
  const router = useRouter();
  const globalFilterFn = (
    row: CoreRow<AuctionTransaction>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { purpose, total_amount_paid, bidder } = row.original;
    const { bidder_number } = bidder;

    return [purpose, total_amount_paid, bidder_number]
      .filter(Boolean)
      .some((field) => field.toString().toLowerCase().includes(search));
  };

  return (
    <DataTable
      columns={columns}
      data={transactions}
      onRowClick={(receipt) =>
        router.push(`payments/${receipt.receipt_number}`)
      }
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search item here",
        },
      }}
    />
  );
};
