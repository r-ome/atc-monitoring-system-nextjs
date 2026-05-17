"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3 } from "lucide-react";
import { AuctionsInventory } from "src/entities/models/Auction";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { AuctionStatusPill } from "@/app/(protected)/auctions/components/AuctionStatusPill";
import { CoreRow, Row } from "@tanstack/react-table";
import { columns } from "./monitoring-columns";
import { buildGroupIndexMap, cn, formatNumberToCurrency } from "@/app/lib/utils";
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

  const pathname = usePathname();
  const router = useRouter();

  const renderMobileCard = (row: Row<AuctionsInventory>) => {
    const it = row.original;
    const bidderLabel =
      it.bidder.bidder_number === "5013" ? "ATC" : `#${it.bidder.bidder_number}`;
    const idx = it.is_slash_item ? groupIndexMap[it.is_slash_item] : undefined;
    const onBarcodeTap = () => {
      if (!isMasterList) {
        router.push(`${pathname}/${it.auction_inventory_id}`);
      }
    };
    return (
      <div className="flex flex-col gap-1 px-4 py-3">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-mono text-[12px] font-semibold",
              !isMasterList && "cursor-pointer underline decoration-dotted underline-offset-2",
            )}
            onClick={onBarcodeTap}
          >
            {it.inventory.barcode}
          </span>
          <span className="font-mono text-[10.5px] text-muted-foreground">
            · {it.inventory.control}
            {idx ? `(A${idx})` : ""}
          </span>
          <span className="ml-auto">
            <AuctionStatusPill status={it.status} />
          </span>
        </div>
        <div className="text-[13px] font-medium">{it.description}</div>
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[11px] text-muted-foreground">
            {bidderLabel}
          </span>
          {it.manifest_number ? (
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-foreground/80">
              {it.manifest_number}
            </span>
          ) : null}
          <span className="ml-auto font-mono text-[13px] font-semibold">
            {formatNumberToCurrency(it.price)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <AuctionDataTable
      icon={BarChart3}
      title="Monitoring"
      meta={`${monitoring.length.toLocaleString()} items`}
      rowLabel="item"
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
        filterComponentProps: { placeholder: "Filter by status" },
      }}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search barcode, control, description…",
        },
      }}
      renderMobileCard={renderMobileCard}
    />
  );
};
