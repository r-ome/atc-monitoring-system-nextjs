"use client";

import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { CoreRow, Row } from "@tanstack/react-table";
import { columns } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/registered-bidders-columns";
import type { RegisteredBidderSummary } from "src/entities/models/Bidder";
import { cn, formatNumberToCurrency } from "@/app/lib/utils";

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

  const renderMobileCard = (row: Row<RegisteredBidderSummary>) => {
    const rb = row.original;
    const isCancelledBin = rb.bidder.bidder_number === "5013";

    if (isCancelledBin) {
      return (
        <div className="flex items-center gap-3 px-4 py-3 opacity-60">
          <span className="text-[15px] text-muted-foreground italic">
            CANCELLED ITEMS
          </span>
          <span className="ml-auto font-mono text-[13px] text-muted-foreground">
            {rb.auction_inventories_count.toLocaleString()} items
          </span>
        </div>
      );
    }

    const initials = rb.bidder.full_name
      .split(" ")
      .slice(0, 2)
      .map((s) => s[0])
      .join("");

    return (
      <div className="flex items-center gap-2.5 px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-[13px] font-bold text-accent-foreground">
          {initials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[13px] font-semibold text-muted-foreground">
              #{rb.bidder.bidder_number}
            </span>
            <span className="truncate text-[15px] font-medium">
              {rb.bidder.full_name}
            </span>
          </div>
          <span className="mt-0.5 text-[13px] text-muted-foreground">
            {rb.auction_inventories_count} items · {rb.service_charge}% ·{" "}
            {rb.created_at}
          </span>
        </div>
        {rb.balance > 0 ? (
          <span
            className={cn(
              "shrink-0 font-mono text-[14.5px] font-bold",
              "text-destructive",
            )}
          >
            {formatNumberToCurrency(rb.balance)}
          </span>
        ) : (
          <span className="shrink-0 rounded bg-status-success/10 px-1.5 py-0.5 text-[12.5px] font-bold tracking-wider text-status-success">
            PAID
          </span>
        )}
      </div>
    );
  };

  return (
    <AuctionDataTable
      icon={Users}
      title="Registered Bidders"
      meta={`${registeredBidders.length.toLocaleString()} entries`}
      rowLabel="bidder"
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
          placeholder: "Search by bidder # or name…",
        },
      }}
      columnFilter={{
        column: "balance",
        options: [
          { label: "PAID", value: "PAID" },
          { label: "UNPAID", value: "UNPAID" },
        ],
        filterComponentProps: { placeholder: "Filter by status" },
      }}
      renderMobileCard={renderMobileCard}
    />
  );
};
