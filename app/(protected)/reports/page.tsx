"use server";

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/app/lib/auth";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getBranches } from "../branches/actions";
import { SalesFilter } from "./components/SalesFilter";
import { ReportTabs } from "./components/ReportTabs";
import { FinancialTabContent } from "./components/FinancialTabContent";
import { BidderTabContent } from "./components/BidderTabContent";
import { InventoryTabContent } from "./components/InventoryTabContent";
import { OperationalTabContent } from "./components/OperationalTabContent";
import { SupplierTabContent } from "./components/SupplierTabContent";
import { Card, CardHeader } from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { FilterMode } from "src/entities/models/Report";

const ReportTabFallback = () => (
  <div className="flex flex-col gap-4 pt-2">
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-48 w-full" />
  </div>
);

const Page = async ({
  searchParams,
}: Readonly<{
  params: Promise<{ transaction_date: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}>) => {
  const { branch_id, year, month, filter_mode } = await searchParams;

  await requireUser();

  const branch_res = await getBranches();
  if (!branch_res.ok) return <ErrorComponent error={branch_res.error} />;
  const branches = branch_res.value;

  const default_branch = branches.find((b) => b.name === "BIÑAN");
  const branchId = String(branch_id ?? default_branch?.branch_id);
  if (!branchId) redirect("/");

  const selected_branch =
    branches.find((b) => b.branch_id === branchId) ?? default_branch;

  const selected_year = year ?? "2026";
  const selected_month = month ?? "00";
  const filterMode: FilterMode = filter_mode === "daily" ? "daily" : "monthly";

  if (!selected_branch) return <div>what</div>;

  const dateParam =
    filterMode === "monthly"
      ? selected_year
      : `${selected_year}-${selected_month}`;

  const tabBranchId = selected_branch.branch_id;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <SalesFilter
            branches={branches}
            selectedBranch={selected_branch}
            selectedYear={selected_year}
            selectedMonth={selected_month}
            filterMode={filterMode}
          />
        </CardHeader>
      </Card>

      <ReportTabs
        tabs={[
          {
            value: "financial",
            label: "Financial Reports",
            content: (
              <Suspense fallback={<ReportTabFallback />}>
                <FinancialTabContent
                  branchId={tabBranchId}
                  dateParam={dateParam}
                  mode={filterMode}
                />
              </Suspense>
            ),
          },
          {
            value: "bidders",
            label: "Bidder Reports",
            content: (
              <Suspense fallback={<ReportTabFallback />}>
                <BidderTabContent
                  branchId={tabBranchId}
                  dateParam={dateParam}
                />
              </Suspense>
            ),
          },
          {
            value: "inventory",
            label: "Inventory Reports",
            content: (
              <Suspense fallback={<ReportTabFallback />}>
                <InventoryTabContent
                  branchId={tabBranchId}
                  dateParam={dateParam}
                />
              </Suspense>
            ),
          },
          {
            value: "operational",
            label: "Operational",
            content: (
              <Suspense fallback={<ReportTabFallback />}>
                <OperationalTabContent
                  branchId={tabBranchId}
                  dateParam={dateParam}
                />
              </Suspense>
            ),
          },
          {
            value: "suppliers",
            label: "Supplier Reports",
            content: (
              <Suspense fallback={<ReportTabFallback />}>
                <SupplierTabContent
                  branchId={tabBranchId}
                  dateParam={dateParam}
                />
              </Suspense>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Page;
