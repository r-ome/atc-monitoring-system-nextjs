"use client";

import { useState, useEffect } from "react";
import { Cake } from "lucide-react";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./birthdates-columns";
import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";
import { getBidderBirthdates } from "@/app/(protected)/home/actions";

export const BirthdatesTable = () => {
  const [bidders, setBidders] = useState<
    BiddersWithBirthdatesAndRecentAuctionSchema[]
  >([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getBidderBirthdates();
      if (!result.ok) return "what";

      setBidders(result.value);
    };
    fetchInitialData();
  }, []);

  return (
    <>
      <DataTable
        title={
          <div className="flex gap-2 items-center">
            <Cake color="violet" />
            <div className="text-xl font-bold">Upcoming Bidder Birthdays</div>
          </div>
        }
        columns={columns}
        data={bidders}
      />
    </>
  );
};
