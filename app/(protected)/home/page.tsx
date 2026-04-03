import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { AuctionStatisticsTable } from "./components/AuctionStatisticsTable/AuctionStatisticsTable";
import { BidderStatsCard } from "./components/BidderStatsCard";
import { ContainersDueDateTable } from "./components/ContainersTable/ContainersDueDateTable";
import { HomeCalendar } from "./components/HomeCalendar";

const Page = async () => {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="list" className="gap-4">
        <div className="flex justify-end">
          <TabsList>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="calendar">
          <HomeCalendar />
        </TabsContent>

        <TabsContent value="list">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="lg:w-3/5">
              <AuctionStatisticsTable />
            </div>
            <div className="lg:w-2/5">
              <ContainersDueDateTable />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <BidderStatsCard />
    </div>
  );
};

export default Page;
