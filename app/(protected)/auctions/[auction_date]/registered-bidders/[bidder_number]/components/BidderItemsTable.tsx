"use client";

import { useState, useMemo } from "react";
import { safeGetItem } from "@/app/lib/local-storage";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow, RowSelectionState } from "@tanstack/react-table";
import {
  AuctionInventory,
  columns,
} from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/auction-inventories-columns";
import { RegisteredBidder } from "src/entities/models/Bidder";
import { ProfileActionButtons } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/ProfileActionButtons";
import { BidderPullOutModalProvider } from "../context/BidderPullOutModalContext";

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
      return auctionInventories.filter((item) => item.status === "UNPAID");

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

  return (
    <BidderPullOutModalProvider>
      <DataTable
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
      />
    </BidderPullOutModalProvider>
  );
}
