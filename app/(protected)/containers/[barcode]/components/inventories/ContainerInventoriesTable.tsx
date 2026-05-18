"use client";

import { UploadInventoryModal } from "./UploadInventoryModal";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./inventory-columns";
import { Container } from "src/entities/models/Container";
import { Inventory } from "src/entities/models/Inventory";
import { CoreRow, Row } from "@tanstack/react-table";
import { AuctionsInventory } from "src/entities/models/Auction";
import { GenerateContainerReportModal } from "./GenerateContainerReportModal";
import { FinalReportWorkbench } from "./FinalReportWorkbench";
import { CreateInventoryModal } from "../../inventories/[inventory_id]/CreateInventoryModal";
import { AppendInventoriesModal } from "./AppendInventoriesModal";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Boxes, ChevronDown, RefreshCwIcon } from "lucide-react";
import { InventoryStatusBadge } from "@/app/components/admin";

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
  userBranchId: string;
  tarlacBranchId: string | null;
}

export const ContainerInventoriesTable: React.FC<ContainerInventoriesProps> = ({
  inventories,
  container,
  userBranchId,
  tarlacBranchId,
}) => {
  const router = useRouter();
  const pathname = usePathname();

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

  const renderMobileCard = (row: Row<InventoryRowType>) => {
    const inv = row.original;
    return (
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[14px] font-semibold">
              {inv.barcode}
            </span>
            <span className="font-mono text-[12.5px] text-muted-foreground">
              {inv.control || "NC"}
            </span>
            <InventoryStatusBadge status={inv.status} />
          </div>
          <span className="truncate text-[14px]">{inv.description}</span>
          {inv.auction_date ? (
            <span className="text-[12px] text-muted-foreground">
              Auction · {String(inv.auction_date)}
            </span>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <DataTable
      embedded={false}
      icon={Boxes}
      title="Inventories"
      meta={`${inventories.length.toLocaleString()} entries`}
      rowLabel="inventory"
      columns={columns}
      data={inventories}
      onRowClick={(inv) => router.push(`${pathname}/inventories/${inv.inventory_id}`)}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search by barcode or control number…",
        },
      }}
      actionButtons={
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button>
                Actions
                <ChevronDown className="ml-1 size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="flex w-56 flex-col gap-1.5 p-1.5 [&_button]:w-full [&_button]:justify-start"
            >
              <UploadInventoryModal />
              <CreateInventoryModal container={container} />
              <GenerateContainerReportModal
                inventories={inventories}
                container={container}
                userBranchId={userBranchId}
                tarlacBranchId={tarlacBranchId}
              />
              <FinalReportWorkbench
                inventories={inventories}
                container={container}
                userBranchId={userBranchId}
                tarlacBranchId={tarlacBranchId}
              />
              <AppendInventoriesModal inventories={inventories} />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={() => router.refresh()}>
            <RefreshCwIcon />
          </Button>
        </div>
      }
      renderMobileCard={renderMobileCard}
    />
  );
};
