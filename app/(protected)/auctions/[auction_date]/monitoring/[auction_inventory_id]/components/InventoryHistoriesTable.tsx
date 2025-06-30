"use client";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/app/components/ui/table";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { AuctionsInventory } from "src/entities/models/Auction";

interface InventoryHistoriesTableProps {
  histories: AuctionsInventory["histories"];
}

export const InventoryHistoriesTable: React.FC<
  InventoryHistoriesTableProps
> = ({ histories }) => {
  return (
    <div className="max-h-[400px] overflow-y-auto relative">
      <Table>
        <TableHeader className="sticky top-0 bg-secondary">
          <TableRow>
            <TableCell>Date & Time</TableCell>
            <TableCell>Auction Status</TableCell>
            <TableCell>Inventory Status</TableCell>
            <TableCell>Receipt</TableCell>
            <TableCell className="">Remarks</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody className="max-h-[150px] overflow-scroll">
          {histories.map((history) => (
            <TableRow key={history.inventory_history_id}>
              <TableCell>{history.created_at}</TableCell>
              <TableCell>{history.auction_status}</TableCell>
              <TableCell className="">{history.inventory_status}</TableCell>
              <TableCell className="">{history.receipt_number}</TableCell>
              <TableCell className="max-w-[130px]">
                <Tooltip>
                  <TooltipTrigger className="overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]">
                    {history.remarks}
                  </TooltipTrigger>
                  <TooltipContent side="left">{history.remarks}</TooltipContent>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
