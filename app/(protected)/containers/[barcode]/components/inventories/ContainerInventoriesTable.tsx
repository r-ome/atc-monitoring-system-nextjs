"use client";

import { UploadInventoryModal } from "./UploadInventoryModal";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./inventory-columns";
import { Container } from "src/entities/models/Container";
import { Inventory } from "src/entities/models/Inventory";
import { CoreRow } from "@tanstack/react-table";
import { Button } from "@/app/components/ui/button";
import { generateReport } from "@/app/lib/reports";
import { AuctionsInventory } from "src/entities/models/Auction";

export type InventoryRowType = Omit<
  Inventory,
  "histories" | "auctions_inventories"
> & {
  auctions_inventories: Omit<
    AuctionsInventory,
    "inventory" | "receipt" | "histories"
  >[];
};

interface ContainerInventoriesProps {
  inventories: InventoryRowType[];
  container: Omit<Container, "inventories"> & {
    inventories: InventoryRowType[];
  };
}

export const ContainerInventoriesTable: React.FC<ContainerInventoriesProps> = ({
  inventories,
  container,
}) => {
  const globalFilterFn = (
    row: CoreRow<InventoryRowType>,
    columnId?: string,
    filterValue?: string
  ) => {
    const barcode = (row.original as InventoryRowType).barcode.toLowerCase();
    const control =
      (row.original as InventoryRowType).control?.toLowerCase() ?? "";
    const search = (filterValue ?? "").toLowerCase();

    return barcode.includes(search) || control?.includes(search);
  };

  const for_monitoring_report = inventories
    .filter((item) => item.status !== "VOID")
    .filter((item) => {
      if (!item.auctions_inventories.length) return false;
      const auction_status = item.auctions_inventories[0].status;
      return !["CANCELLED", "REFUND"].includes(auction_status);
    })
    .map((item) => ({
      barcode: item.barcode,
      control: item.control,
      description: item.auctions_inventories[0].description,
      bidder_number: item.auctions_inventories[0].bidder.bidder_number,
      qty: item.auctions_inventories[0].qty,
      price: item.auctions_inventories[0].price,
      status: item.status,
    }));

  return (
    <div>
      <div className="w-full flex flex-col gap-4">
        <div className="flex gap-4 w-full">
          <UploadInventoryModal />
          <Button
            onClick={() => {
              let filename = `${container.supplier.name.toUpperCase()} ${container.barcode.toUpperCase()}`;
              if (filename.length > 30) {
                filename = filename.replace("CO.,LTD", "");
              }
              generateReport(
                {
                  monitoring: for_monitoring_report,
                  sheetDetails: container,
                },
                ["monitoring", "final_computation", "unsold", "encode", "bill"],
                filename
              );
            }}
          >
            Generate Report
          </Button>
        </div>

        <DataTable
          columns={columns}
          data={inventories}
          searchFilter={{
            globalFilterFn,
            searchComponentProps: {
              placeholder: "Search By Barcode or Control Number",
            },
          }}
        />
      </div>
    </div>
  );
};
