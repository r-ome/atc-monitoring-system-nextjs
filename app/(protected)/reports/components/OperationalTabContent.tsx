import { GetOperationalReportController } from "src/controllers/reports/get-operational-report.controller";
import { AuctionComparisonChart } from "./AuctionComparisonChart";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface Props {
  branchId: string;
  dateParam: string;
}

export const OperationalTabContent = async ({ branchId, dateParam }: Props) => {
  const res = await GetOperationalReportController(branchId, dateParam);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Card>
        <CardHeader><CardTitle>Auction Comparison</CardTitle></CardHeader>
        <CardContent>
          <AuctionComparisonChart data={res.value.auctionComparison} />
        </CardContent>
      </Card>
    </div>
  );
};
