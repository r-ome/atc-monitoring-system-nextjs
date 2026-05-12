"use client";

import { useMemo, useState } from "react";
import { CoreRow } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { FilterColumnComponent } from "@/app/components/data-table/FilterColumnComponent";
import { columns } from "./container-columns";
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
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const canUseFilters = FILTER_ALLOWED_ROLES.has(userRole);

  const branchOptions = useMemo(
    () =>
      Array.from(
        new Map(
          containers.map((container) => [
            container.branch.branch_id,
            { value: container.branch.branch_id, label: container.branch.name },
          ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label)),
    [containers],
  );

  const filteredContainers = useMemo(() => {
    if (!canUseFilters) return containers;

    return containers.filter((container) => {
      if (
        selectedBranches.length > 0 &&
        !selectedBranches.includes(container.branch.branch_id)
      ) {
        return false;
      }

      if (
        selectedStatuses.length > 0 &&
        !selectedStatuses.includes(container.status)
      ) {
        return false;
      }

      return true;
    });
  }, [canUseFilters, containers, selectedBranches, selectedStatuses]);

  const globalFilterFn = (
    row: CoreRow<ContainerRowType>,
    columnId?: string,
    filterValue?: string
  ) => {
    const barcode = (row.original as ContainerRowType).barcode.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return barcode.includes(search);
  };

  return (
    <DataTable
      columns={columns}
      data={filteredContainers}
      actionButtons={
        canUseFilters ? (
          <div className="flex flex-col gap-2 md:flex-row">
            <FilterColumnComponent
              options={branchOptions}
              onChangeEvent={setSelectedBranches}
              placeholder="Filter by Branch"
            />
            <FilterColumnComponent
              options={STATUS_OPTIONS}
              onChangeEvent={setSelectedStatuses}
              placeholder="Filter by Status"
            />
          </div>
        ) : null
      }
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search By Barcode",
        },
      }}
    />
  );
};
