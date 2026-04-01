import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { presentSellThrough } from "src/controllers/reports/get-sell-through.controller";
import { presentRefundCancellation } from "src/controllers/reports/get-refund-cancellation.controller";
import { presentPriceComparison } from "src/controllers/reports/get-price-comparison.controller";
import { SellThroughTable } from "./SellThroughTable";
import { RefundCancellationTable } from "./RefundCancellationTable";
import { RefundCancellationBidderTable } from "./RefundCancellationBidderTable";
import { PriceComparisonChart } from "./PriceComparisonChart";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface Props {
  branchId: string;
  dateParam: string;
}

export const InventoryTabContent = async ({ branchId, dateParam }: Props) => {
  try {
    const [sellThroughRows, refundRows, priceComparisonRows] = await Promise.all([
      ReportsRepository.getAuctionInventoriesForSellThrough(branchId, dateParam),
      ReportsRepository.getRefundCancellationItems(branchId, dateParam),
      ReportsRepository.getPriceComparisonByMonth(branchId, dateParam),
    ]);

    return (
      <div className="flex flex-col gap-4 pt-2">
        <Card>
          <CardHeader><CardTitle>Sell-Through Rate</CardTitle></CardHeader>
          <CardContent>
            <SellThroughTable data={presentSellThrough(sellThroughRows)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Refunds & Cancellations</CardTitle></CardHeader>
          <CardContent>
            <RefundCancellationTable data={presentRefundCancellation(refundRows)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Affected Bidders</CardTitle></CardHeader>
          <CardContent>
            <RefundCancellationBidderTable data={presentRefundCancellation(refundRows)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bought Item Price Comparison</CardTitle></CardHeader>
          <CardContent>
            <PriceComparisonChart data={presentPriceComparison(priceComparisonRows)} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    const cause = error instanceof DatabaseOperationError ? error.message : "Server Error";
    return <ErrorComponent error={{ message: "Failed to load inventory reports", cause }} />;
  }
};
