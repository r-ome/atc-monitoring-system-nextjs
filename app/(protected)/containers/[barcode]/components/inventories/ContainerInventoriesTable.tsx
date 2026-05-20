"use client";

import { useState, useTransition } from "react";
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
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Boxes, RefreshCwIcon } from "lucide-react";
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
  const [isRefreshing, startRefresh] = useTransition();
  const [openUpload, setOpenUpload] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [openGenerate, setOpenGenerate] = useState(false);
  const [openFinalReport, setOpenFinalReport] = useState(false);

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>Options</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setOpenUpload(true)}>
                Upload Inventory File
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenCreate(true)}>
                Create Inventory
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenGenerate(true)}>
                Generate Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setOpenFinalReport(true)}>
                Generate Final Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            disabled={isRefreshing}
            onClick={() => startRefresh(() => router.refresh())}
            title="Refresh"
          >
            <RefreshCwIcon className={isRefreshing ? "animate-spin" : ""} />
          </Button>

          <UploadInventoryModal
            open={openUpload}
            onOpenChange={setOpenUpload}
          />
          <CreateInventoryModal
            container={container}
            open={openCreate}
            onOpenChange={setOpenCreate}
          />
          <GenerateContainerReportModal
            inventories={inventories}
            container={container}
            userBranchId={userBranchId}
            tarlacBranchId={tarlacBranchId}
            open={openGenerate}
            onOpenChange={setOpenGenerate}
          />
          <FinalReportWorkbench
            inventories={inventories}
            container={container}
            userBranchId={userBranchId}
            tarlacBranchId={tarlacBranchId}
            open={openFinalReport}
            onOpenChange={setOpenFinalReport}
          />
        </div>
      }
      renderMobileCard={renderMobileCard}
    />
  );
};
