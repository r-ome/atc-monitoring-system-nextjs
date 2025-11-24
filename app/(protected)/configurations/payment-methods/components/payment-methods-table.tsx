"use client";

import { useState } from "react";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./payment-methods-columns";
import { UpdatePaymentMethodModal } from "./UpdatePaymentMethodModal";

export type PaymentMethodRowType = PaymentMethod;

interface PaymentMethodsTableProps {
  payment_methods: PaymentMethodRowType[];
}

export const PaymentMethodsTable = ({
  payment_methods,
}: PaymentMethodsTableProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<PaymentMethod>({
    payment_method_id: "",
    name: "",
    state: "DISABLED",
  } as PaymentMethod);

  const globalFilterFn = (
    row: CoreRow<PaymentMethodRowType>,
    columnId?: string,
    filterValue?: string
  ) => {
    const payment_method = row.original as PaymentMethodRowType;
    const name = payment_method.name.toLowerCase();
    const state = payment_method.state.toLowerCase();
    const search = (filterValue ?? "").toLowerCase();

    return [name, state]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
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
      />
    </>
  );
};
