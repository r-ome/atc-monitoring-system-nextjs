"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import { AlertCircle } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/app/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/app/components/ui/tooltip";
import { formatNumberToCurrency, formatDate } from "@/app/lib/utils";
import { generateReport } from "@/app/lib/reports";
import { Button } from "@/app/components/ui/button";
import {
  getUnpaidBidders,
  getUnpaidBidderBalanceSummary,
  getBannedBidders,
} from "@/app/(protected)/home/actions";
import type {
  UnpaidBidders,
  UnpaidBidderBalanceSummary,
  BannedBidder,
} from "src/entities/models/Statistics";
import type { UserRole } from "src/entities/models/User";

const PRIVILEGED_ROLES = new Set<UserRole>(["OWNER", "SUPER_ADMIN"]);

function BranchChip({ branch }: { branch: string }) {
  const isBinan = branch.toUpperCase().includes("BI");
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-secondary-foreground 2xl:text-[14px]"
      style={{
        background: isBinan ? "var(--branch-binan)" : "var(--branch-tarlac)",
      }}
    >
      {branch.toUpperCase()}
    </span>
  );
}

export function UnpaidBiddersCard() {
  const { data: sessionData } = useSession();
  const router = useRouter();
  const [unpaid, setUnpaid] = useState<UnpaidBidders[]>([]);
  const [summary, setSummary] = useState<UnpaidBidderBalanceSummary>({
    branches: [],
    total_balance: 0,
  });
  const [banned, setBanned] = useState<BannedBidder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const user = sessionData?.user;
  const canViewAll = !!user && PRIVILEGED_ROLES.has(user.role as UserRole);

  const visibleBranches = useMemo(() => {
    if (!user || canViewAll) return summary.branches;
    return summary.branches.filter((b) => b.branch_id === user.branch?.branch_id);
  }, [summary.branches, canViewAll, user]);

  useEffect(() => {
    Promise.all([
      getUnpaidBidders(),
      getUnpaidBidderBalanceSummary(),
      getBannedBidders(),
    ]).then(([unpaidRes, summaryRes, bannedRes]) => {
      if (!unpaidRes.ok) { setError(unpaidRes.error.message); return; }
      if (!summaryRes.ok) { setError(summaryRes.error.message); return; }
      if (!bannedRes.ok) { setError(bannedRes.error.message); return; }
      setUnpaid(unpaidRes.value);
      setSummary(summaryRes.value);
      setBanned(bannedRes.value);
    });
  }, []);

  const sortedUnpaid = useMemo(
    () => [...unpaid].sort((a, b) => b.balance - a.balance),
    [unpaid],
  );

  if (error) {
    return (
      <Card className="flex items-center gap-2 p-4 text-destructive">
        <AlertCircle size={14} />
        <span className="text-sm">{error}</span>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col p-0 overflow-hidden 2xl:text-[15px]">
      <Tabs defaultValue="unpaid" className="flex flex-col flex-1">
        {/* Tab header */}
        <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
          <TabsList className="h-8 gap-0 bg-transparent p-0">
            <TabsTrigger
              value="unpaid"
              className="h-8 rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none 2xl:text-[17px]"
            >
              Unpaid Bidders
            </TabsTrigger>
            <TabsTrigger
              value="banned"
              className="h-8 rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none 2xl:text-[17px]"
            >
              Banned Bidders
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Unpaid tab */}
        <TabsContent value="unpaid" className="flex flex-col gap-0 mt-0 px-4 pb-3.5 pt-3 2xl:px-6 2xl:pb-5 2xl:pt-4">
          {/* Total + branch breakdown */}
          <div className="flex flex-col gap-3 mb-3 sm:grid sm:grid-cols-[1fr_1px_1fr] sm:items-center sm:gap-3.5">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <AlertCircle size={11} className="text-destructive" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-destructive 2xl:text-[14px]">
                  Total Outstanding
                </span>
              </div>
              <div className="font-mono text-[22px] font-semibold leading-tight tracking-tight text-destructive 2xl:text-[26px]">
                {formatNumberToCurrency(summary.total_balance)}
              </div>
            </div>
            <div className="hidden h-10 bg-border sm:block" />
            <div className="flex flex-col gap-1">
              {visibleBranches.map((b) => (
                <div key={b.branch_id} className="flex items-baseline gap-1.5">
                  <span className="min-w-[48px] text-[11px] font-semibold tracking-wide 2xl:text-[15px]">
                    {b.branch_name.toUpperCase()}
                  </span>
                  <span className="font-mono ml-auto text-[12px] font-medium 2xl:text-[16px]">
                    {formatNumberToCurrency(b.total_balance)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-border mb-2" />

          {/* List header */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground 2xl:text-[15px]">
              Unpaid Bidders
            </span>
            {mounted && user && (
              <Button
                size="sm"
                onClick={() =>
                  generateReport(
                    { branch: user.branch.name, bidders: unpaid },
                    ["unpaid_bidders"],
                    `UNPAID ${user.branch.name} ${new Date().getFullYear()}`,
                  )
                }
              >
                Generate Report
              </Button>
            )}
          </div>

          {/* Bidder rows */}
          <div className="flex flex-col overflow-y-auto max-h-[196px] xl:max-h-[210px] 2xl:max-h-[310px]">
            {sortedUnpaid.map((b, i) => (
              <div
                key={`${b.bidder_id}-${b.auction_date}`}
                className="flex cursor-pointer items-center gap-2.5 px-1 py-2 hover:bg-secondary/50 rounded"
                style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)" }}
                onClick={() =>
                  router.push(
                    `/auctions/${formatDate(new Date(b.auction_date), "yyyy-MM-dd")}/registered-bidders/${b.bidder_number}`,
                  )
                }
              >
                <span className="font-mono min-w-[44px] text-[12px] font-semibold text-muted-foreground 2xl:text-[16px]">
                  #{b.bidder_number}
                </span>
                <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[12px] text-muted-foreground 2xl:text-[16px]">
                  {b.first_name} {b.last_name} · {b.items} item{b.items > 1 ? "s" : ""} ·{" "}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default underline decoration-dotted">{b.auction_duration}</span>
                    </TooltipTrigger>
                    <TooltipContent>{b.auction_date}</TooltipContent>
                  </Tooltip>
                </span>
                <span className="font-mono text-[13px] font-semibold text-destructive 2xl:text-[17px]">
                  {formatNumberToCurrency(b.balance)}
                </span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Banned tab */}
        <TabsContent value="banned" className="mt-0 px-4 pb-3.5 pt-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground 2xl:text-[15px]">
              Banned Bidders
            </span>
            <span className="text-[11px] text-muted-foreground 2xl:text-[15px]">{banned.length} bidders</span>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
            <table className="w-full border-collapse text-[12px] 2xl:text-[16px]">
              <thead>
                <tr className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground 2xl:text-[14px]">
                  <th className="text-left py-1.5 px-1.5">Bidder #</th>
                  <th className="text-left py-1.5 px-1.5">Full Name</th>
                  <th className="text-left py-1.5 px-1.5">Branch</th>
                  <th className="text-left py-1.5 px-1.5">Reason</th>
                  <th className="text-right py-1.5 px-1.5">Date Banned</th>
                </tr>
              </thead>
              <tbody>
                {banned.map((b) => (
                  <tr
                    key={b.bidder_id}
                    className="cursor-pointer border-t border-border hover:bg-secondary/50"
                    onClick={() =>
                      router.push(`/bidders/${b.bidder_number}-${b.branch_name}`)
                    }
                  >
                    <td className="font-mono py-2.5 px-1.5 font-semibold text-muted-foreground">
                      #{b.bidder_number}
                    </td>
                    <td className="py-2.5 px-1.5 font-medium">{b.full_name}</td>
                    <td className="py-2.5 px-1.5">
                      <BranchChip branch={b.branch_name} />
                    </td>
                    <td className="py-2.5 px-1.5 text-muted-foreground">{b.remarks ?? "—"}</td>
                    <td className="font-mono py-2.5 px-1.5 text-right text-muted-foreground">
                      {b.banned_at ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
