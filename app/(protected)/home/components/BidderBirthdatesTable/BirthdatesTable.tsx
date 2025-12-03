"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
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

  const globalFilterFn = (
    row: CoreRow<BiddersWithBirthdatesAndRecentAuctionSchema>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const {
      bidder_number,
      first_name,
      last_name,
      last_auction_date,
      birthdate,
    } = row.original;

    return [
      bidder_number,
      `${first_name} ${last_name}`,
      last_auction_date,
      birthdate,
    ]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  return (
    <>
      <DataTable
        title={
          <div className="text-xl font-bold">Upcoming Bidder Birthdays</div>
        }
        columns={columns}
        data={bidders}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search bidder here",
          },
        }}
      />
    </>
  );
};
