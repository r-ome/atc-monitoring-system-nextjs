"use client";

import { useState } from "react";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./payment-methods-columns";
import { UpdatePaymentMethodModal } from "./UpdatePaymentMethodModal";

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
