"use client";

import { UploadInventoryModal } from "./UploadInventoryModal";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./inventory-columns";
import { Container } from "src/entities/models/Container";
import { Inventory } from "src/entities/models/Inventory";
import { CoreRow } from "@tanstack/react-table";
import { AuctionsInventory } from "src/entities/models/Auction";
import { GenerateContainerReportModal } from "./GenerateContainerReportModal";

export type InventoryRowType = Omit<
  Inventory,
  "histories" | "auctions_inventory"
> & {
  auctions_inventory: Omit<
    AuctionsInventory,
    "inventory" | "receipt" | "histories"
  > | null;
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

  return (
    <div>
      <div className="w-full flex flex-col gap-4">
        <div className="flex gap-4 w-full">
          <UploadInventoryModal />
          <GenerateContainerReportModal
            inventories={inventories}
            container={container}
          />
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
