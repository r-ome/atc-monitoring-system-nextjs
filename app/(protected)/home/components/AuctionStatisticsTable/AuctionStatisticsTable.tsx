"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./auction-statistics-columns";
import { AuctionsStatistics } from "src/entities/models/Statistics";
import { getAuctionsStatistics } from "@/app/(protected)/home/actions";
import { formatDate } from "@/app/lib/utils";

export const AuctionStatisticsTable = () => {
  const router = useRouter();
  const [auctions, setAuctions] = useState<AuctionsStatistics[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getAuctionsStatistics();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }

      setAuctions(result.value);
    };
    fetchInitialData();
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center p-6 text-red-500">
        Failed to load auctions: {error}
      </div>
    );
  }

  return (
    <DataTable
      title={
        <div className="flex gap-2 items-center">
          <Calendar />
          <div className="text-xl font-bold">Auctions</div>
        </div>
      }
      onRowClick={(auction) =>
        router.push(
          `/auctions/${formatDate(
            new Date(auction.auction_date),
            "yyyy-MM-dd"
          )}`
        )
      }
      columns={columns}
      data={auctions}
    />
  );
};
