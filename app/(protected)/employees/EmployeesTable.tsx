"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { getColumns } from "./employee-columns";
import { Employee } from "src/entities/models/Employee";
import { UpdateEmployeeModal } from "./UpdateEmployeeModal";
import type { Branch } from "src/entities/models/Branch";
import { BranchBadge, StatusBadge } from "@/app/components/admin/status-badge";

interface EmployeesTableProps {
  employees: Employee[];
  branches: Branch[];
  isAdmin: boolean;
  actionButtons?: React.ReactNode;
}

export const EmployeesTable: React.FC<EmployeesTableProps> = ({
  employees,
  branches,
  isAdmin,
  actionButtons,
}) => {
  const [selected, setSelected] = useState<Employee | null>(null);

  const renderMobileCard = (row: Row<Employee>) => {
    const e = row.original;
    const isRegular = e.worker_type === "REGULAR_WORKER";
    const basePay =
      e.salary_type === "DAILY_RATE" && e.default_daily_rate != null
        ? `₱${Number(e.default_daily_rate).toLocaleString()}/day`
        : e.salary_type === "FIXED_MONTHLY" && e.default_monthly_salary != null
          ? `₱${Number(e.default_monthly_salary).toLocaleString()}/cutoff`
          : null;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[15px] font-medium">{e.full_name}</span>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <span className="truncate">{e.position ?? "—"}</span>
            {basePay ? (
              <>
                <span>·</span>
                <span className="font-mono">{basePay}</span>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <StatusBadge variant={isRegular ? "success" : "neutral"}>
            {isRegular ? "Regular" : "Extra"}
          </StatusBadge>
          {isAdmin && e.branch?.name ? (
            <BranchBadge branch={e.branch.name} />
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <>
      <DataTable
        columns={getColumns(isAdmin)}
        data={employees}
        onRowClick={(e) => setSelected(e)}
        actionButtons={actionButtons}
        searchFilter={{
          globalFilterFn: "includesString",
          searchComponentProps: { placeholder: "Search employees…" },
        }}
        initialSorting={[{ id: "full_name", desc: false }]}
        columnFilter={{
          column: "worker_type",
          options: [
            { value: "REGULAR_WORKER", label: "Regular" },
            { value: "EXTRA_WORKER", label: "Extra" },
          ],
          filterComponentProps: { placeholder: "Filter by type" },
        }}
        renderMobileCard={renderMobileCard}
      />
      {selected && (
        <UpdateEmployeeModal
          employee={selected}
          branches={branches}
          isAdmin={isAdmin}
          open={selected !== null}
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
        />
      )}
    </>
  );
};
