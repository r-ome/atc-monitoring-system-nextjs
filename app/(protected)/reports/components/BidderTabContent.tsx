import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { presentUnpaidBidders } from "src/controllers/reports/get-unpaid-bidders.controller";
import { presentBidderActivity } from "src/controllers/reports/get-bidder-activity.controller";
import { presentTopBidders } from "src/controllers/reports/get-top-bidders.controller";
import { UnpaidBiddersTable } from "./UnpaidBiddersTable";
import { BidderActivityTable } from "./BidderActivityTable";
import { TopBiddersTable } from "./TopBiddersTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface Props {
  branchId: string;
  dateParam: string;
}

export const BidderTabContent = async ({ branchId, dateParam }: Props) => {
  try {
    // Single DB fetch shared across all three bidder reports (was: 3×)
    const bidders = await ReportsRepository.getBiddersWithAuctions(branchId, dateParam);

    const unpaid = presentUnpaidBidders(bidders);
    const activity = presentBidderActivity(bidders);
    const topBidders = presentTopBidders(bidders);

    return (
      <div className="flex flex-col gap-4 pt-2">
        <Card>
          <CardHeader><CardTitle>Unpaid Bidders</CardTitle></CardHeader>
          <CardContent>
            <UnpaidBiddersTable data={unpaid} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Bidder Activity</CardTitle></CardHeader>
          <CardContent>
            <BidderActivityTable data={activity} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Bidders</CardTitle></CardHeader>
          <CardContent>
            <TopBiddersTable data={topBidders} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    const cause = error instanceof DatabaseOperationError ? error.message : "Server Error";
    return <ErrorComponent error={{ message: "Failed to load bidder reports", cause }} />;
  }
};
