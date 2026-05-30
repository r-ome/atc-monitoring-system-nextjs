"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import { safeGetItem } from "@/app/lib/local-storage";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { CoreRow, Row, RowSelectionState } from "@tanstack/react-table";
import {
  AuctionInventory,
  ManifestNumberDisplay,
  columns,
} from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/auction-inventories-columns";
import { RegisteredBidder } from "src/entities/models/Bidder";
import { ProfileActionButtons } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/ProfileActionButtons";
import { BidderPullOutModalProvider } from "../context/BidderPullOutModalContext";
import { Checkbox } from "@/app/components/ui/checkbox";
import { AuctionStatusPill } from "@/app/(protected)/auctions/components/AuctionStatusPill";
import { formatDate, formatNumberToCurrency } from "@/app/lib/utils";

interface BidderItemsTableProps {
  auctionInventories: RegisteredBidder["auction_inventories"];
  registeredBidder: RegisteredBidder;
}

export function BidderItemsTable({
  auctionInventories,
  registeredBidder,
}: BidderItemsTableProps) {
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});

  const selectedItems = useMemo(() => {
    const selectedRowsKeys = Object.keys(selectedRows);
    if (!selectedRowsKeys.length)
      return auctionInventories.filter((item) =>
        ["UNPAID", "PARTIAL"].includes(item.status),
      );

    return auctionInventories.filter((item) =>
      selectedRowsKeys.includes(item.auction_inventory_id)
    );
  }, [selectedRows, auctionInventories]);

  const selectLastPrintedReceipt = () => {
    const raw = safeGetItem(registeredBidder?.auction_bidder_id);
    const lastPrinted = raw ? JSON.parse(raw) : [];
    const selection: RowSelectionState = {};
    auctionInventories.forEach((item) => {
      if (lastPrinted.includes(item.auction_inventory_id)) {
        selection[item.auction_inventory_id] = true;
      }
    });

    setSelectedRows(selection);
  };

  const globalFilterFn = (
    row: CoreRow<AuctionInventory>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { description, price, manifest_number, inventory } = row.original;
    const { barcode, control } = inventory;

    return [barcode, control, description, manifest_number, price]
      .filter(Boolean)
      .some((field) => field!.toString().toLowerCase().includes(search));
  };

  const router = useRouter();

  const renderMobileCard = (row: Row<AuctionInventory>) => {
    const it = row.original;
    return (
      <div className="flex items-start gap-2.5 px-4 py-3">
        <div
          className="pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-mono text-[14px] font-semibold underline decoration-dotted underline-offset-2"
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/auctions/${formatDate(
                    new Date(it.auction_date),
                    "yyyy-MM-dd",
                  )}/monitoring/${it.auction_inventory_id}`,
                );
              }}
            >
              {it.inventory.barcode}
            </span>
            <span className="font-mono text-[12.5px] text-muted-foreground">
              · {it.inventory.control}
            </span>
            <span className="ml-auto">
              <AuctionStatusPill status={it.status} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="line-clamp-1 text-[15px] font-medium">
              {it.description}
            </span>
            {it.qty ? (
              <span className="font-mono text-[13px] text-muted-foreground">
                ×{it.qty}
              </span>
            ) : null}
            <span className="ml-auto font-mono text-[14.5px] font-semibold">
              {formatNumberToCurrency(it.price)}
            </span>
          </div>
          {it.manifest_number ? (
            <div className="text-[13px] text-muted-foreground">
              Manifest{" "}
              <span className="font-mono font-semibold text-foreground/80">
                <ManifestNumberDisplay manifestNumber={it.manifest_number} />
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <BidderPullOutModalProvider>
      <AuctionDataTable
        icon={Package}
        title="Bidder Items"
        meta={`${auctionInventories.length.toLocaleString()} entries`}
        rowLabel="item"
        columns={columns}
        data={auctionInventories}
        getRowId={(row) => row.auction_inventory_id}
        rowSelection={{
          selectedRows,
          onRowSelectionChange: setSelectedRows,
        }}
        actionButtons={
          <ProfileActionButtons
            selectedItems={selectedItems}
            registeredBidder={registeredBidder}
            selectLastPrintedReceipt={selectLastPrintedReceipt}
          />
        }
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search item here",
          },
        }}
        columnFilter={{
          column: "auction_status",
          options: [
            { label: "PAID", value: "PAID" },
            { label: "UNPAID", value: "UNPAID" },
          ],
          filterComponentProps: { placeholder: "Filter by status" },
        }}
        renderMobileCard={renderMobileCard}
      />
    </BidderPullOutModalProvider>
  );
}
