"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { CounterCheck } from "src/entities/models/CounterCheck";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./counter-check-columns";
import { UpdateCounterCheckModal } from "./components/UpdateCounterCheckModal";
import { formatNumberToCurrency } from "@/app/lib/utils";

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

  const totalCounterCheckPrice = counterCheck.reduce((acc, item) => {
    const price = item.price ? parseInt(item.price, 10) : 0;
    return acc + price;
  }, 0);

  return (
    <>
      <UpdateCounterCheckModal
        open={open}
        setOpen={setOpen}
        selected={selected}
      />

      <AuctionDataTable
        icon={ClipboardCheck}
        title="Counter Check"
        meta={`Total ${formatNumberToCurrency(totalCounterCheckPrice)}`}
        rowLabel="row"
        columns={columns()}
        data={counterCheck}
        onRowClick={(row) => {
          setOpen(true);
          setSelected(row);
        }}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search control # or bidder…",
          },
        }}
      />
    </>
  );
};
