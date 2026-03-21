import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { presentAuctionComparison } from "src/controllers/reports/get-auction-comparison.controller";
import { AuctionComparisonChart } from "./AuctionComparisonChart";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface Props {
  branchId: string;
  dateParam: string;
}

export const OperationalTabContent = async ({ branchId, dateParam }: Props) => {
  try {
    const auctions = await ReportsRepository.getTotalSales(branchId, dateParam);

    return (
      <div className="flex flex-col gap-4 pt-2">
        <Card>
          <CardHeader><CardTitle>Auction Comparison</CardTitle></CardHeader>
          <CardContent>
            <AuctionComparisonChart data={presentAuctionComparison(auctions)} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    const cause = error instanceof DatabaseOperationError ? error.message : "Server Error";
    return <ErrorComponent error={{ message: "Failed to load operational reports", cause }} />;
  }
};
