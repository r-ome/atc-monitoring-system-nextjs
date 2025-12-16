"use client";

import { useMemo } from "react";
import { AuctionsInventory } from "src/entities/models/Auction";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./monitoring-columns";
import { buildGroupIndexMap } from "@/app/lib/utils";
import { CounterCheck } from "src/entities/models/CounterCheck";

interface MonitoringTableProps {
  monitoring: AuctionsInventory[];
  isMasterList?: boolean;
  counterCheck?: CounterCheck[];
}

export const MonitoringTable = ({
  monitoring,
  isMasterList = false,
  counterCheck = [],
}: MonitoringTableProps) => {
  const globalFilterFn = (
    row: CoreRow<AuctionsInventory>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { description, qty, price, manifest_number, inventory, status } =
      row.original;
    const { barcode, control } = inventory;
    const { bidder_number } = row.original.bidder;

    return [
      barcode,
      bidder_number,
      control,
      qty,
      description,
      price.toString(),
      manifest_number,
      status,
    ]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  const groupIndexMap = useMemo(
    () => buildGroupIndexMap(monitoring, (r) => r.is_slash_item),
    [monitoring]
  );

  return (
    <DataTable
      pageSize={isMasterList ? 20 : 10}
      columns={columns(groupIndexMap, isMasterList, counterCheck)}
      data={monitoring}
      columnFilter={{
        column: "status",
        options: [
          { label: "PAID", value: "PAID" },
          { label: "UNPAID", value: "UNPAID" },
          { label: "CANCELLED", value: "CANCELLED" },
          { label: "REFUNDED", value: "REFUNDED" },
        ],
        filterComponentProps: { placeholder: "Filter By Status" },
      }}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search item here",
        },
      }}
    />
  );
};
