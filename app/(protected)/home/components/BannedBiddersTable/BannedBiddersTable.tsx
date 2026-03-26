"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ShieldBanIcon } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/app/components/ui/alert";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./banned-bidders-columns";
import { BannedBidder } from "src/entities/models/Statistics";
import { getBannedBidders } from "@/app/(protected)/home/actions";

export const BannedBiddersTable = () => {
  const router = useRouter();
  const [bannedBidders, setBannedBidders] = useState<BannedBidder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      const result = await getBannedBidders();
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setBannedBidders(result.value);
    };
    fetchInitialData();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Failed to load banned bidders</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <DataTable
      title={
        <div className="flex gap-2 items-center mb-2">
          <ShieldBanIcon className="text-destructive" />
          <div className="text-xl font-bold text-destructive">Banned Bidders</div>
        </div>
      }
      onRowClick={(row) =>
        router.push(`/bidders/${row.bidder_number}-${row.branch_name}`)
      }
      columns={columns}
      data={bannedBidders}
    />
  );
};
