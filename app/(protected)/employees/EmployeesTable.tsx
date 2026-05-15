"use client";

import { useState } from "react";
import { DataTable } from "@/app/components/data-table/data-table";
import { getColumns } from "./employee-columns";
import { Employee } from "src/entities/models/Employee";
import { UpdateEmployeeModal } from "./UpdateEmployeeModal";
import type { Branch } from "src/entities/models/Branch";

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
