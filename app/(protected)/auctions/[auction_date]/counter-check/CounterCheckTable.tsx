"use client";

import { useState } from "react";
import { CounterCheck } from "src/entities/models/CounterCheck";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./counter-check-columns";
import { UpdateCounterCheckModal } from "./components/UpdateCounterCheckModal";

interface CounterCheckTableProps {
  counterCheck: CounterCheck[];
}

export const CounterCheckTable = ({ counterCheck }: CounterCheckTableProps) => {
  const [open, setOpen] = useState<boolean>(false);
  const [selected, setSelected] = useState<CounterCheck | undefined>();
  const globalFilterFn = (
    row: CoreRow<CounterCheck>,
    _columnId?: string,
    filterValue?: string,
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { page, price, bidder_number, control, description, time } =
      row.original;

    return [bidder_number, control, price?.toString(), page, description, time]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  const totalCounterCheckPrice = counterCheck
    .reduce((acc, item) => {
      const price = item.price ? parseInt(item.price, 10) : 0;
      acc += price;
      return acc;
    }, 0)
    .toLocaleString();

  return (
    <>
      <UpdateCounterCheckModal
        open={open}
        setOpen={setOpen}
        selected={selected}
      />

      <div>Total: {totalCounterCheckPrice}</div>

      <DataTable
        columns={columns()}
        data={counterCheck}
        onRowClick={(row) => {
          setOpen(true);
          setSelected(row);
        }}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search item here",
          },
        }}
      />
    </>
  );
};
