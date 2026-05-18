"use client";

import { useState } from "react";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow, Row } from "@tanstack/react-table";
import { columns } from "./payment-methods-columns";
import { UpdatePaymentMethodModal } from "./UpdatePaymentMethodModal";
import { StatusBadge } from "@/app/components/admin";

const EMPTY_PAYMENT_METHOD: PaymentMethod = {
  payment_method_id: "",
  name: "",
  state: "DISABLED",
  created_at: "",
  updated_at: "",
  deleted_at: null,
};

interface PaymentMethodsTableProps {
  payment_methods: PaymentMethod[];
}

export const PaymentMethodsTable = ({
  payment_methods,
}: PaymentMethodsTableProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<PaymentMethod>(EMPTY_PAYMENT_METHOD);

  const globalFilterFn = (
    row: CoreRow<PaymentMethod>,
    _columnId: string,
    filterValue: string
  ) => {
    const { name, state } = row.original;
    const search = filterValue.toLowerCase();
    return [name, state].some((field) => field.toLowerCase().includes(search));
  };

  const renderMobileCard = (row: Row<PaymentMethod>) => {
    const pm = row.original;
    return (
      <div
        className="flex items-center gap-3 px-4 py-3"
        onClick={() => {
          setOpen(true);
          setSelected(pm);
        }}
      >
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[13px] font-medium">{pm.name}</span>
          <span className="mt-0.5 text-[11px] text-muted-foreground">
            Created {pm.created_at} · Updated {pm.updated_at}
          </span>
        </div>
        <StatusBadge variant={pm.state === "ENABLED" ? "active" : "inactive"}>
          {pm.state}
        </StatusBadge>
      </div>
    );
  };

  return (
    <>
      <UpdatePaymentMethodModal
        open={open}
        setOpen={setOpen}
        selected={selected}
      />
      <DataTable
        columns={columns(setOpen, setSelected)}
        data={payment_methods}
        renderMobileCard={renderMobileCard}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search By Payment Method Name",
          },
        }}
        columnFilter={{
          column: "state",
          options: [
            { value: "ENABLED", label: "Enabled" },
            { value: "DISABLED", label: "Disabled" },
          ],
          filterComponentProps: {
            placeholder: "Filter by State",
          },
        }}
      />
    </>
  );
};
