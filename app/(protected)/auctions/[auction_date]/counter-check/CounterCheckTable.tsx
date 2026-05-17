"use client";

import { useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { CounterCheck } from "src/entities/models/CounterCheck";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { CoreRow, Row } from "@tanstack/react-table";
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
        renderMobileCard={(row: Row<CounterCheck>) => {
          const c = row.original;
          const price = c.price ? parseInt(c.price, 10) : 0;
          return (
            <div className="flex items-center gap-2.5 px-4 py-3">
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[12.5px] font-semibold">
                    {c.control}
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground">
                    #{c.bidder_number}
                  </span>
                  {c.page ? (
                    <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10.5px] text-foreground/80">
                      p.{c.page}
                    </span>
                  ) : null}
                </div>
                <span className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {c.description || "No description"}
                </span>
              </div>
              <span className="shrink-0 font-mono text-[13px] font-semibold">
                {formatNumberToCurrency(price)}
              </span>
            </div>
          );
        }}
      />
    </>
  );
};
