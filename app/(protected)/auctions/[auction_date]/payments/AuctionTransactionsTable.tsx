"use client";

import { useRouter } from "next/navigation";
import { Receipt } from "lucide-react";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { CoreRow, Row } from "@tanstack/react-table";
import { columns } from "./transactions-columns";
import { AuctionTransaction, REFUND_PURPOSES } from "src/entities/models/Payment";
import { cn, formatNumberToCurrency } from "@/app/lib/utils";

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
      renderMobileCard={(row: Row<AuctionTransaction>) => {
        const t = row.original;
        const isRefund = REFUND_PURPOSES.includes(t.purpose);
        return (
          <div className="flex items-center gap-2.5 px-4 py-3">
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[14.5px] font-semibold">
                  {t.receipt_number}
                </span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[12px] font-semibold uppercase tracking-wider",
                    isRefund
                      ? "bg-destructive/10 text-destructive"
                      : "bg-status-success/15 text-status-success",
                  )}
                >
                  {t.purpose.replace(/_/g, " ")}
                </span>
              </div>
              <span className="mt-0.5 text-[13px] text-muted-foreground">
                <span className="font-mono">#{t.bidder.bidder_number}</span> ·{" "}
                {t.created_at}
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 whitespace-nowrap font-mono text-[15px] font-bold",
                isRefund ? "text-destructive" : "text-status-success",
              )}
            >
              {isRefund
                ? `(${formatNumberToCurrency(t.total_amount_paid)})`
                : formatNumberToCurrency(t.total_amount_paid)}
            </span>
          </div>
        );
      }}
    />
  );
};
