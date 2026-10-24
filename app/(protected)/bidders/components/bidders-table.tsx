"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { CoreRow, Row } from "@tanstack/react-table";
import { columns } from "./bidder-columns";
import { BranchBadge, StatusBadge } from "@/app/components/admin";

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
  initialColumnFilters?: { id: string; value: unknown }[];
}

export const BiddersTable = ({
  bidders,
  initialColumnFilters,
}: BiddersTableProps) => {
  const router = useRouter();

  const branchOptions = useMemo(() => {
    const seen = new Set<string>();
    return bidders
      .filter((b) => b.branch.name && !seen.has(b.branch.name) && seen.add(b.branch.name))
      .map((b) => ({ value: b.branch.name, label: b.branch.name }));
  }, [bidders]);

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

  const renderMobileCard = (row: Row<BidderRowType>) => {
    const b = row.original;
    const lastActive = b.last_active.duration ?? "Never";
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="min-w-[52px] font-mono text-[15px] font-semibold">
          #{b.bidder_number}
        </span>
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-medium uppercase">
            {b.full_name}
          </span>
          <span className="mt-0.5 flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
            <BranchBadge branch={b.branch.name} />
            <span aria-hidden>·</span>
            <span className="truncate">{lastActive}</span>
          </span>
        </div>
        <StatusBadge variant={b.status === "ACTIVE" ? "active" : "inactive"}>
          {b.status}
        </StatusBadge>
      </div>
    );
  };

  return (
    <AuctionDataTable
      icon={Users}
      title="All Bidders"
      meta={`${bidders.length.toLocaleString()} ${bidders.length === 1 ? "entry" : "entries"}`}
      rowLabel="bidder"
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
      columnFilters={[
        {
          column: "branch_name",
          options: branchOptions,
          filterComponentProps: { placeholder: "Filter by Branch" },
        },
        {
          column: "status",
          options: [
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "BANNED", label: "Banned" },
          ],
          filterComponentProps: { placeholder: "Filter by Status" },
        },
      ]}
      initialColumnFilters={
        initialColumnFilters ?? [{ id: "status", value: ["ACTIVE"] }]
      }
      renderMobileCard={renderMobileCard}
    />
  );
};
