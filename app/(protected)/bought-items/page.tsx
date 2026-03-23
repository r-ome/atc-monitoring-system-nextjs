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

export default async function Page({
  searchParams,
}: Readonly<{ searchParams: Promise<Record<string, string>> }>) {
  const { branch_id, year, month } = await searchParams;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");

  const { user } = session;

  const now = new Date();
  const selectedYear = year ?? String(now.getFullYear());
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
    month: selectedMonth,
    branchId,
  });

  if (!bought_items_res.ok) {
    return <ErrorComponent error={{ message: "Server Error" }} />;
  }

  const bought_items = bought_items_res.value;

  return (
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
        selectedMonth={selectedMonth}
      />

      <div className="flex gap-4">
        <UploadBoughtItemsModal selectedBranch={selected_branch} />
        <GenerateBoughtItemsReport boughtItems={bought_items} />
      </div>

      <BoughtItemsTable boughtItems={bought_items} />
    </div>
  );
}
