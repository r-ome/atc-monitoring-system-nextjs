"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { UnpaidBiddersTable } from "./UnpaidBiddersTable/UnpaidBiddersTable";
import { BannedBiddersTable } from "./BannedBiddersTable/BannedBiddersTable";

export const BidderStatsCard = () => {
  return (
    <div className="rounded-md border p-4">
      <Tabs defaultValue="unpaid">
        <TabsList>
          <TabsTrigger value="unpaid">Unpaid Bidders</TabsTrigger>
          <TabsTrigger value="banned">Banned Bidders</TabsTrigger>
        </TabsList>
        <TabsContent value="unpaid">
          <UnpaidBiddersTable />
        </TabsContent>
        <TabsContent value="banned">
          <BannedBiddersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};
