"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Cake } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/app/components/ui/alert";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./birthdates-columns";
import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";
import { getBidderBirthdates } from "@/app/(protected)/home/actions";

export const BirthdatesTable = () => {
  const [bidders, setBidders] = useState<
    BiddersWithBirthdatesAndRecentAuctionSchema[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getBidderBirthdates();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setBidders(result.value);
    };
    fetchInitialData();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Failed to load bidder birthdays</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

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
