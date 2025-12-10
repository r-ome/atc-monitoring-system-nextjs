"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./unpaid-bidders-columns";
import { UnpaidBidders } from "src/entities/models/Statistics";
import { getUnpaidBidders } from "@/app/(protected)/home/actions";
import { formatDate } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { generateReport } from "@/app/lib/reports";

export const UnpaidBiddersTable = () => {
  const session = useSession();
  const router = useRouter();
  const [unpaidBidders, setUnpaidBidders] = useState<UnpaidBidders[]>([]);

  const user = session.data?.user;

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getUnpaidBidders();
      if (!result.ok) return "what";

      setUnpaidBidders(result.value);
    };
    fetchInitialData();
  }, []);

  if (!user) return <div></div>;

  return (
    <DataTable
      title={
        <div className="flex gap-2 items-center justify-between">
          <div className="flex">
            <TriangleAlert color="red" />
            <div className="text-xl font-bold text-red-500">Unpaid Bidders</div>
          </div>
          <Button
            size="sm"
            onClick={() =>
              generateReport(
                {
                  branch: user.branch.name,
                  bidders: unpaidBidders,
                },
                ["unpaid_bidders"],
                `UNPAID ${user.branch.name} ${new Date().getFullYear()}`
              )
            }
          >
            Generate Report
          </Button>
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
