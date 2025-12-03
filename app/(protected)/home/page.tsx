import { BirthdatesTable } from "@/app/(protected)/home/components/BidderBirthdatesTable/BirthdatesTable";
import { ContainersDueDateTable } from "./components/ContainersTable/ContainersDueDateTable";
import { UnpaidBiddersTable } from "./components/UnpaidBiddersTable/UnpaidBiddersTable";
import { AuctionStatisticsTable } from "./components/AuctionStatisticsTable/AuctionStatisticsTable";

const Page = async () => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="w-3/5">
          <BirthdatesTable />
        </div>
        <div className="w-2/5 h-fit">
          <UnpaidBiddersTable />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="w-1/3">
          <ContainersDueDateTable />
        </div>
        <div className="w-2/3">
          <AuctionStatisticsTable />
        </div>
      </div>
    </div>
  );
};

export default Page;
