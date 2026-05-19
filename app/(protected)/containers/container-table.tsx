"use client";

import { useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CoreRow, Row } from "@tanstack/react-table";
import { Container } from "lucide-react";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { columns } from "./container-columns";
import { BranchBadge, StatusBadge } from "@/app/components/admin";
import type { UserRole } from "src/entities/models/User";

const FILTER_ALLOWED_ROLES = new Set<UserRole>(["SUPER_ADMIN", "OWNER"]);

const STATUS_OPTIONS = [
  { value: "PAID", label: "PAID" },
  { value: "UNPAID", label: "UNPAID" },
];

export type ContainerRowType = {
  container_id: string;
  barcode: string;
  supplier_id: string;
  branch_id: string;
  bill_of_lading_number: string;
  container_number: string;
  gross_weight: string;
  auction_or_sell: string;
  status: string;
  paid_at: string | null;
  duties_and_taxes: number;
  branch: { branch_id: string; name: string };
  supplier: { supplier_id: string; supplier_code: string; name: string };
  arrival_date?: string;
  auction_start_date?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  inventory_count: number;
};

interface ContainersTableProps {
  containers: ContainerRowType[];
  userRole: UserRole;
}

export const ContainersTable: React.FC<ContainersTableProps> = ({
  containers,
  userRole,
}) => {
  const canUseFilters = FILTER_ALLOWED_ROLES.has(userRole);

  const branchOptions = useMemo(
    () =>
      Array.from(
        new Map(
          containers.map((container) => [
            container.branch.name,
            { value: container.branch.name, label: container.branch.name },
          ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [containers],
  );

  const globalFilterFn = (
    row: CoreRow<ContainerRowType>,
    _columnId?: string,
    filterValue?: string,
  ) => {
    const barcode = row.original.barcode.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();
    return barcode.includes(search);
  };

  const router = useRouter();
  const pathname = usePathname();

  const renderMobileCard = (row: Row<ContainerRowType>) => {
    const c = row.original;
    return (
      <div className="flex flex-col gap-1.5 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[15px] font-semibold">
            {c.barcode}
          </span>
          <span className="ml-auto">
            <StatusBadge variant={c.status === "PAID" ? "paid" : "unpaid"}>
              {c.status}
            </StatusBadge>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground">
          <span className="truncate">{c.supplier.name}</span>
          <span aria-hidden>·</span>
          <BranchBadge branch={c.branch.name} />
          <span className="ml-auto font-mono text-[13px]">
            {c.inventory_count} item{c.inventory_count === 1 ? "" : "s"}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span>Auction {c.auction_start_date ?? "N/A"}</span>
          <span aria-hidden>·</span>
          <span>Due {c.due_date ?? "N/A"}</span>
          {c.paid_at ? (
            <span className="ml-auto">Paid {c.paid_at}</span>
          ) : null}
        </div>
      </div>
    );
  };

  const columnFilters = canUseFilters
    ? [
        {
          column: "branch_name",
          options: branchOptions,
          filterComponentProps: { placeholder: "Filter by Branch" },
        },
        {
          column: "status",
          options: STATUS_OPTIONS,
          filterComponentProps: { placeholder: "Filter by Status" },
        },
      ]
    : undefined;

  return (
    <AuctionDataTable
      icon={Container}
      title="All Containers"
      meta={`${containers.length.toLocaleString()} total`}
      rowLabel="container"
      columns={columns}
      data={containers}
      onRowClick={(c) => router.push(`${pathname}/${c.barcode}`)}
      renderMobileCard={renderMobileCard}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search By Barcode",
        },
      }}
      columnFilters={columnFilters}
    />
  );
};
