"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./unpaid-bidders-columns";
import { UnpaidBidders } from "src/entities/models/Statistics";
import { getUnpaidBidders } from "@/app/(protected)/home/actions";
import { formatDate } from "@/app/lib/utils";

export const UnpaidBiddersTable = () => {
  const router = useRouter();
  const [unpaidBidders, setUnpaidBidders] = useState<UnpaidBidders[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getUnpaidBidders();
      if (!result.ok) return "what";

      setUnpaidBidders(result.value);
    };
    fetchInitialData();
  }, []);

  return (
    <DataTable
      title={
        <div className="flex gap-2 items-center">
          <TriangleAlert color="red" />
          <div className="text-xl font-bold text-red-500">Unpaid Bidders</div>
        </div>
      }
      onRowClick={(auction) =>
        router.push(
          `/auctions/${formatDate(
            new Date(auction.auction_date),
            "yyyy-MM-dd"
          )}/registered-bidders/${auction.bidder_number}`
        )
      }
      columns={columns}
      data={unpaidBidders}
    />
  );
};
