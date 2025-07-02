"use client";

import { Button } from "@/app/components/ui/button";
import { generateReport } from "@/app/lib/reports";
import { BoughtItems } from "src/entities/models/Inventory";

interface GenerateBoughtItemsReportProps {
  boughtItems: BoughtItems[];
}

export const GenerateBoughtItemsReport: React.FC<
  GenerateBoughtItemsReportProps
> = ({ boughtItems }) => {
  return (
    <div>
      <Button
        onClick={() =>
          generateReport({ boughtItems }, ["bought_items"], "Bought Items")
        }
      >
        Generate Report
      </Button>
    </div>
  );
};
