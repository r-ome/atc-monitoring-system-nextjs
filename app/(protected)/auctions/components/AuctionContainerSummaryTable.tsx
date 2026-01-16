"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./auction-container-columns";

interface AuctionContainerSummaryTableProps {
  containerSummary: {
    barcode: string;
    total_items: number;
    total_sale: number;
  }[];
}

export const AuctionContainerSummaryTable = ({
  containerSummary,
}: AuctionContainerSummaryTableProps) => {
  return (
    <div className="w-full">
      <DataTable
        title="Container Summary"
        columns={columns}
        data={containerSummary}
      />
    </div>
  );
};
