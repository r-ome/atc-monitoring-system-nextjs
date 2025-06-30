"use client";

import { useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { AuctionsInventory } from "src/entities/models/Auction";
import { generateReport } from "@/app/lib/reports";
import { format } from "date-fns";

interface GenerateReportProps {
  monitoring: AuctionsInventory[];
}

export const GenerateReportButton: React.FC<GenerateReportProps> = ({
  monitoring,
}) => {
  const { auction_date }: { auction_date: string } = useParams();

  return (
    <>
      <Button
        onClick={() => {
          generateReport(
            {
              monitoring: monitoring.map((item) => ({
                barcode: item.inventory.barcode,
                control: item.inventory.control,
                description: item.description,
                bidder_number: item.bidder.bidder_number,
                qty: item.qty,
                price: item.price,
              })),
            },
            ["monitoring"],
            `${format(new Date(auction_date), "yyyy-MM-dd")} Monitoring`
          );
        }}
      >
        Generate Report
      </Button>
    </>
  );
};
