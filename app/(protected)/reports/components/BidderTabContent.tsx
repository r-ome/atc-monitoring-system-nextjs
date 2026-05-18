import { GetBidderReportsController } from "src/controllers/reports/get-bidder-reports.controller";
import { UnpaidBiddersTable } from "./UnpaidBiddersTable";
import { BidderActivityTable } from "./BidderActivityTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";

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
      <UnpaidBiddersTable data={res.value.unpaid} />
      <BidderActivityTable data={res.value.activity} />
    </div>
  );
};
