import { GetInventoryReportsController } from "src/controllers/reports/get-inventory-reports.controller";
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
  const res = await GetInventoryReportsController(branchId, dateParam);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Card>
        <CardHeader><CardTitle>Refunds & Cancellations</CardTitle></CardHeader>
        <CardContent>
          <RefundCancellationTable data={res.value.refundCancellation} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Top Affected Bidders</CardTitle></CardHeader>
        <CardContent>
          <RefundCancellationBidderTable
            data={res.value.refundCancellationByBidder}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Bought Item Price Comparison</CardTitle></CardHeader>
        <CardContent>
          <PriceComparisonChart data={res.value.priceComparison} />
        </CardContent>
      </Card>
    </div>
  );
};
