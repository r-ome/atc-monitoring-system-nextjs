import { GetBidderReportsController } from "src/controllers/reports/get-bidder-reports.controller";
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
  const res = await GetBidderReportsController(branchId, dateParam);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <Card>
        <CardHeader><CardTitle>Unpaid Bidders</CardTitle></CardHeader>
        <CardContent>
          <UnpaidBiddersTable data={res.value.unpaid} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Bidder Activity</CardTitle></CardHeader>
        <CardContent>
          <BidderActivityTable data={res.value.activity} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Top Bidders</CardTitle></CardHeader>
        <CardContent>
          <TopBiddersTable data={res.value.topBidders} />
        </CardContent>
      </Card>
    </div>
  );
};
