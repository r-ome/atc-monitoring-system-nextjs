import { GetAuctionKpisController } from "src/controllers/reports/get-auction-kpis.controller";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { AuctionKpisChart } from "./AuctionKpisChart";

interface Props {
  branchId: string;
  year: string;
}

export const AuctionReportsTabContent = async ({ branchId, year }: Props) => {
  const res = await GetAuctionKpisController(branchId, year);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <AuctionKpisChart data={res.value} year={year} />
    </div>
  );
};
