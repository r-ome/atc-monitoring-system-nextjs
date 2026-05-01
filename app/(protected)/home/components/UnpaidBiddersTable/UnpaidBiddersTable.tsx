"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, TriangleAlert } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/app/components/ui/alert";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./unpaid-bidders-columns";
import {
  UnpaidBidderBalanceSummary,
  UnpaidBidders,
} from "src/entities/models/Statistics";
import {
  getUnpaidBidderBalanceSummary,
  getUnpaidBidders,
} from "@/app/(protected)/home/actions";
import { formatDate, formatNumberToCurrency } from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { generateReport } from "@/app/lib/reports";
import type { UserRole } from "src/entities/models/User";

const EMPTY_BALANCE_SUMMARY: UnpaidBidderBalanceSummary = {
  branches: [],
  total_balance: 0,
};

const PRIVILEGED_BALANCE_ROLES = new Set<UserRole>([
  "OWNER",
  "SUPER_ADMIN",
]);

export const UnpaidBiddersTable = () => {
  const session = useSession();
  const router = useRouter();
  const [unpaidBidders, setUnpaidBidders] = useState<UnpaidBidders[]>([]);
  const [balanceSummary, setBalanceSummary] =
    useState<UnpaidBidderBalanceSummary>(EMPTY_BALANCE_SUMMARY);
  const [error, setError] = useState<string | null>(null);

  const user = session.data?.user;
  const canViewAllBranchBalances =
    !!user && PRIVILEGED_BALANCE_ROLES.has(user.role);

  const visibleBranchBalances = useMemo(() => {
    if (!user) return [];
    if (canViewAllBranchBalances) return balanceSummary.branches;

    const currentBranchBalance = balanceSummary.branches.find(
      (branch) => branch.branch_id === user.branch.branch_id,
    );

    return [
      currentBranchBalance ?? {
        branch_id: user.branch.branch_id,
        branch_name: user.branch.name,
        total_balance: 0,
      },
    ];
  }, [balanceSummary.branches, canViewAllBranchBalances, user]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const [unpaidBiddersResult, balanceSummaryResult] = await Promise.all([
        getUnpaidBidders(),
        getUnpaidBidderBalanceSummary(),
      ]);

      if (!unpaidBiddersResult.ok) {
        setError(unpaidBiddersResult.error.message);
        return;
      }

      if (!balanceSummaryResult.ok) {
        setError(balanceSummaryResult.error.message);
        return;
      }

      setUnpaidBidders(unpaidBiddersResult.value);
      setBalanceSummary(balanceSummaryResult.value);
    };
    fetchInitialData();
  }, []);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Failed to load unpaid bidders</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!user) return null;

  return (
    <DataTable
      title={
        <div className="flex flex-col gap-3">
          <div className="flex gap-2 items-center justify-between">
            <div className="flex">
              <TriangleAlert color="red" />
              <div className="text-xl font-bold text-red-500">
                Unpaid Bidders
              </div>
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
          <div className="flex flex-wrap gap-6">
            {visibleBranchBalances.map((branch) => (
              <span key={branch.branch_id}>
                {branch.branch_name} Balance:{" "}
                <span className="text-red-500 font-semibold">
                  {formatNumberToCurrency(branch.total_balance)}
                </span>
              </span>
            ))}
            {canViewAllBranchBalances && (
              <span>
                Total Outstanding:{" "}
                <span className="font-semibold">
                  {formatNumberToCurrency(balanceSummary.total_balance)}
                </span>
              </span>
            )}
          </div>
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
