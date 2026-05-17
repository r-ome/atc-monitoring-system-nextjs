"use client";

import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
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
    <AuctionDataTable
      icon={Receipt}
      title="Transactions"
      meta={`${transactions.length.toLocaleString()} records`}
      rowLabel="transaction"
      columns={columns}
      data={transactions}
      onRowClick={(receipt) =>
        router.push(`payments/${receipt.receipt_number}`)
      }
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search bidder, receipt #…",
        },
      }}
    />
  );
};
