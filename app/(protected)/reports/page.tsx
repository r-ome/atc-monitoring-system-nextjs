"use server";

import { redirect } from "next/navigation";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import {
  getTotalExpenses,
  getTotalSales,
  getPaymentMethodBreakdown,
  getCashFlow,
  getUnpaidBidders,
  getBidderActivity,
  getTopBidders,
  getSellThrough,
  getRefundCancellation,
  getSupplierRevenueSummary,
  getContainerStatusOverview,
  getAuctionComparison,
} from "./actions";
import { SalesTable } from "./components/SalesTable";
import { SalesFilter } from "./components/SalesFilter";
import { PaymentMethodBreakdownTable } from "./components/PaymentMethodBreakdownTable";
import { DailyCashFlowTable } from "./components/DailyCashFlowTable";
import { UnpaidBiddersTable } from "./components/UnpaidBiddersTable";
import { BidderActivityTable } from "./components/BidderActivityTable";
import { TopBiddersTable } from "./components/TopBiddersTable";
import { SellThroughTable } from "./components/SellThroughTable";
import { RefundCancellationTable } from "./components/RefundCancellationTable";
import { SupplierRevenueTable } from "./components/SupplierRevenueTable";
import { ContainerStatusTable } from "./components/ContainerStatusTable";
import { AuctionComparisonChart } from "./components/AuctionComparisonChart";
import { ReportTabs } from "./components/ReportTabs";
import { getBranches } from "../branches/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { FilterMode } from "src/entities/models/Report";

const Page = async ({
  searchParams,
}: Readonly<{
  params: Promise<{ transaction_date: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}>) => {
  const { branch_id, year, month, filter_mode } = await searchParams;
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

  const [
    total_sales_res,
    total_expenses_res,
    payment_method_res,
    cash_flow_res,
    unpaid_bidders_res,
    bidder_activity_res,
    top_bidders_res,
    sell_through_res,
    refund_cancellation_res,
    supplier_revenue_res,
    container_status_res,
    auction_comparison_res,
  ] = await Promise.all([
    getTotalSales(selected_branch.branch_id, dateParam, filterMode),
    getTotalExpenses(selected_branch.branch_id, dateParam, filterMode),
    getPaymentMethodBreakdown(selected_branch.branch_id, dateParam),
    getCashFlow(selected_branch.branch_id, dateParam, filterMode),
    getUnpaidBidders(selected_branch.branch_id, dateParam),
    getBidderActivity(selected_branch.branch_id, dateParam),
    getTopBidders(selected_branch.branch_id, dateParam),
    getSellThrough(selected_branch.branch_id, dateParam),
    getRefundCancellation(selected_branch.branch_id, dateParam),
    getSupplierRevenueSummary(selected_branch.branch_id, dateParam),
    getContainerStatusOverview(selected_branch.branch_id),
    getAuctionComparison(selected_branch.branch_id, dateParam),
  ]);

  if (!total_sales_res.ok) return <ErrorComponent error={total_sales_res.error} />;
  if (!total_expenses_res.ok) return <ErrorComponent error={total_expenses_res.error} />;
  if (!payment_method_res.ok) return <ErrorComponent error={payment_method_res.error} />;
  if (!cash_flow_res.ok) return <ErrorComponent error={cash_flow_res.error} />;
  if (!unpaid_bidders_res.ok) return <ErrorComponent error={unpaid_bidders_res.error} />;
  if (!bidder_activity_res.ok) return <ErrorComponent error={bidder_activity_res.error} />;
  if (!top_bidders_res.ok) return <ErrorComponent error={top_bidders_res.error} />;
  if (!sell_through_res.ok) return <ErrorComponent error={sell_through_res.error} />;
  if (!refund_cancellation_res.ok) return <ErrorComponent error={refund_cancellation_res.error} />;
  if (!supplier_revenue_res.ok) return <ErrorComponent error={supplier_revenue_res.error} />;
  if (!container_status_res.ok) return <ErrorComponent error={container_status_res.error} />;
  if (!auction_comparison_res.ok) return <ErrorComponent error={auction_comparison_res.error} />;

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
              <div className="flex flex-col gap-4 pt-2">
                <Card>
                  <CardHeader><CardTitle>Sales & Expenses Summary</CardTitle></CardHeader>
                  <CardContent>
                    <SalesTable sales={total_sales_res.value} expenses={total_expenses_res.value} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Payment Method Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    <PaymentMethodBreakdownTable data={payment_method_res.value} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader>
                  <CardContent>
                    <DailyCashFlowTable data={cash_flow_res.value} />
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: "bidders",
            label: "Bidder Reports",
            content: (
              <div className="flex flex-col gap-4 pt-2">
                <Card>
                  <CardHeader><CardTitle>Unpaid Bidders</CardTitle></CardHeader>
                  <CardContent>
                    <UnpaidBiddersTable data={unpaid_bidders_res.value} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Bidder Activity</CardTitle></CardHeader>
                  <CardContent>
                    <BidderActivityTable data={bidder_activity_res.value} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Top Bidders</CardTitle></CardHeader>
                  <CardContent>
                    <TopBiddersTable data={top_bidders_res.value} />
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: "inventory",
            label: "Inventory Reports",
            content: (
              <div className="flex flex-col gap-4 pt-2">
                <Card>
                  <CardHeader><CardTitle>Sell-Through Rate</CardTitle></CardHeader>
                  <CardContent>
                    <SellThroughTable data={sell_through_res.value} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Refunds & Cancellations</CardTitle></CardHeader>
                  <CardContent>
                    <RefundCancellationTable data={refund_cancellation_res.value} />
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: "operational",
            label: "Operational",
            content: (
              <div className="flex flex-col gap-4 pt-2">
                <Card>
                  <CardHeader><CardTitle>Auction Comparison</CardTitle></CardHeader>
                  <CardContent>
                    <AuctionComparisonChart data={auction_comparison_res.value} />
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: "suppliers",
            label: "Supplier Reports",
            content: (
              <div className="flex flex-col gap-4 pt-2">
                <Card>
                  <CardHeader><CardTitle>Supplier Revenue Summary</CardTitle></CardHeader>
                  <CardContent>
                    <SupplierRevenueTable data={supplier_revenue_res.value} />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Container Status Overview</CardTitle></CardHeader>
                  <CardContent>
                    <ContainerStatusTable data={container_status_res.value} />
                  </CardContent>
                </Card>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
};

export default Page;
