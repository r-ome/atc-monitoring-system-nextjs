import { ContainersDueDateTable } from "./components/ContainersTable/ContainersDueDateTable";
import { AuctionStatisticsTable } from "./components/AuctionStatisticsTable/AuctionStatisticsTable";
import { BidderStatsCard } from "./components/BidderStatsCard";

const Page = async () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="w-3/5">
          <AuctionStatisticsTable />
        </div>
        <div className="w-2/5">
          <ContainersDueDateTable />
        </div>
      </div>
      <BidderStatsCard />
    </div>
  );
};

export default Page;
