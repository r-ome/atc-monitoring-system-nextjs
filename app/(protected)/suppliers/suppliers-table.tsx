"use client";

import { useRouter } from "next/navigation";
import { Supplier } from "src/entities/models/Supplier";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./suppliers-columns";
import { CoreRow, Row } from "@tanstack/react-table";

export type SupplierRowType = Omit<Supplier, "containers"> & {
  container_count: number;
};

interface SuppliersTableProps {
  suppliers: SupplierRowType[];
}

export const SuppliersTable: React.FC<SuppliersTableProps> = ({
  suppliers,
}) => {
  const router = useRouter();
  const globalFilterFn = (
    row: CoreRow<SupplierRowType>,
    columnId?: string,
    filterValue?: string
  ) => {
    const name = row.original.name.toLowerCase();
    const code = row.original.supplier_code.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return name.includes(search) || code.includes(search);
  };

  const renderMobileCard = (row: Row<SupplierRowType>) => {
    const s = row.original;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-[13px] font-semibold text-muted-foreground">
              {s.supplier_code}
            </span>
            <span className="truncate text-[15px] font-medium">{s.name}</span>
          </div>
          {s.japanese_name ? (
            <span className="mt-0.5 truncate text-[13px] text-muted-foreground">
              {s.japanese_name}
            </span>
          ) : null}
        </div>
        <span className="shrink-0 font-mono text-[13px] text-muted-foreground">
          {s.container_count} container{s.container_count === 1 ? "" : "s"}
        </span>
      </div>
    );
  };

  return (
    <DataTable
      columns={columns}
      data={suppliers}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: { placeholder: "Search By Name or Code" },
      }}
      onRowClick={(supplier) =>
        router.push(`suppliers/${supplier.supplier_code}`)
      }
      renderMobileCard={renderMobileCard}
    />
  );
};
