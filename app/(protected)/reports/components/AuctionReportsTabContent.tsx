import { GetAuctionKpisController } from "src/controllers/reports/get-auction-kpis.controller";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { AuctionKpisChart } from "./AuctionKpisChart";
import { AuctionReportsView } from "./AuctionReportsView";

interface Props {
  branchId: string;
  year: string;
  userRole: string;
}

export const AuctionReportsTabContent = async ({ branchId, year, userRole }: Props) => {
  const res = await GetAuctionKpisController(branchId, year);

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AuctionReportsView
        year={year}
        canCompare={userRole === "SUPER_ADMIN" || userRole === "OWNER"}
        selectedBranchContent={res.ok
          ? <AuctionKpisChart data={res.value} year={year} />
          : <ErrorComponent error={res.error} />}
      />
    </div>
  );
};
