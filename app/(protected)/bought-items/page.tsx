import { getBoughtItems } from "@/app/(protected)/inventories/actions";
import { UploadBoughtItemsModal } from "./UploadBoughtItemsModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { BoughtItemsTable } from "./BoughtItemsTable";
import { GenerateBoughtItemsReport } from "./GenerateBoughtItemsReport";
import { getBranches } from "../branches/actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { BoughtItemsHeader } from "./BoughtItemsHeader";
import { BoughtItemsFilter } from "./BoughtItemsFilter";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { StatCard, StatCardGroup } from "@/app/components/admin/stat-card";
import { AuctionItemSearchOverlay } from "@/app/(protected)/auctions/[auction_date]/AuctionItemSearchOverlay";

export default async function Page({
  searchParams,
}: Readonly<{ searchParams: Promise<Record<string, string>> }>) {
  const { branch_id, year, month, view } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const { user } = session;

  const now = new Date();
  const selectedYear = year ?? String(now.getFullYear());
  const selectedView = view === "yearly" ? "yearly" : "monthly";
  const selectedMonth = month ?? String(now.getMonth());

  const branches_res = await getBranches();
  if (!branches_res.ok) {
    return <ErrorComponent error={{ message: "Server Error" }} />;
  }

  const branches = branches_res.value;

  const fallbackBranch = ["SUPER_ADMIN", "OWNER"].includes(user.role)
    ? (branches.find((b) => b.name === "BIÑAN") ?? null)
    : (branches.find((b) => b.branch_id === user.branch.branch_id) ?? null);

  const branchId = String(branch_id ?? fallbackBranch?.branch_id);
  if (!branchId) redirect("/");

  const selected_branch =
    branches.find((b) => b.branch_id === branchId) ?? fallbackBranch;

  const bought_items_res = await getBoughtItems({
    year: selectedYear,
    month: selectedView === "monthly" ? selectedMonth : undefined,
    view: selectedView,
    branchId,
  });

  if (!bought_items_res.ok) {
    return <ErrorComponent error={{ message: "Server Error" }} />;
  }

  const bought_items = bought_items_res.value;
  const totalOldPrice = bought_items.reduce((sum, item) => sum + (item.old_price ?? 0), 0);
  const totalNewPrice = bought_items.reduce((sum, item) => sum + (item.new_price ?? 0), 0);
  const totalDifference = bought_items.reduce((sum, item) => sum + (item.profit_loss ?? 0), 0);

  return (
    <>
      <AuctionItemSearchOverlay />
      <div className="flex flex-col gap-2">
        <BoughtItemsHeader
          selectedBranch={selected_branch}
        />
        <h1 className="text-2xl text-center">Bought Items Master List</h1>

        <BoughtItemsFilter
          user={user}
          selectedBranch={selected_branch}
          branches={branches}
          selectedYear={selectedYear}
          selectedView={selectedView}
          selectedMonth={selectedMonth}
        />

        <div className="flex gap-4">
          <UploadBoughtItemsModal selectedBranch={selected_branch} />
          <GenerateBoughtItemsReport boughtItems={bought_items} />
        </div>

        <StatCardGroup columns={3}>
          <StatCard
            title="Total Old Price"
            value={formatNumberToCurrency(totalOldPrice)}
            description="Original bought-item cost"
            className="gap-0 py-0 [&_[data-slot=card-content]]:p-3 [&_p.text-2xl]:text-lg"
          />
          <StatCard
            title="Total Resale Price"
            value={formatNumberToCurrency(totalNewPrice)}
            description="Actual bidder resale value"
            className="gap-0 py-0 [&_[data-slot=card-content]]:p-3 [&_p.text-2xl]:text-lg"
          />
          <StatCard
            title="Total Profit/Loss"
            value={formatNumberToCurrency(totalDifference)}
            description={totalDifference >= 0 ? "Net owner profit from resale" : "Net owner loss from resale"}
            variant={totalDifference >= 0 ? "success" : "error"}
            className="gap-0 py-0 [&_[data-slot=card-content]]:p-3 [&_p.text-2xl]:text-lg"
          />
        </StatCardGroup>

        <BoughtItemsTable boughtItems={bought_items} />
      </div>
    </>
  );
}
