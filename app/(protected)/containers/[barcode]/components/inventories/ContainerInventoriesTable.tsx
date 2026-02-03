"use client";

import { UploadInventoryModal } from "./UploadInventoryModal";
import { MergeInventoriesModal } from "./MergeInventoriesModal";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./inventory-columns";
import { Container } from "src/entities/models/Container";
import { Inventory } from "src/entities/models/Inventory";
import { CoreRow } from "@tanstack/react-table";
import { AuctionsInventory } from "src/entities/models/Auction";
import { GenerateContainerReportModal } from "./GenerateContainerReportModal";
import { CreateInventoryModal } from "../../inventories/[inventory_id]/CreateInventoryModal";

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
    filterValue?: string,
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { description, barcode, control } = row.original;

    return [barcode, control, description]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  return (
    <div>
      <div className="w-full flex flex-col gap-4">
        <div className="flex gap-4 w-full">
          <UploadInventoryModal />
          <CreateInventoryModal container={container} />
          <GenerateContainerReportModal
            inventories={inventories}
            container={container}
          />
          <MergeInventoriesModal inventories={inventories} />
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
