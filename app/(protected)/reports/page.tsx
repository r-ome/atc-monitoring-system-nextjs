"use server";

import { redirect } from "next/navigation";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getTotalExpenses, getTotalSales } from "./actions";
import { SalesTable } from "./components/SalesTable";
import { SalesFilter } from "./components/SalesFilter";
import { getBranches } from "../branches/actions";
import { Card, CardContent, CardHeader } from "@/app/components/ui/card";

const Page = async ({
  searchParams,
}: Readonly<{
  params: Promise<{ transaction_date: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}>) => {
  const { branch_id, year, month } = await searchParams;
  const branch_res = await getBranches();
  if (!branch_res.ok) return <ErrorComponent error={branch_res.error} />;
  const branches = branch_res.value;

  const default_branch = branches.find((b) => b.name === "BIÑAN");
  const branchId = String(branch_id ?? default_branch?.branch_id);
  if (!branchId) redirect("/");

  const selected_branch =
    branches.find((b) => b.branch_id === branchId) ?? default_branch;

  const default_year = "2026";
  const selected_year = year ?? default_year;

  const default_month = "00";
  const selected_month = month ?? default_month;

  if (!selected_branch) return <div>what</div>;

  const total_sales_res = await getTotalSales(
    selected_branch?.branch_id,
    `${selected_year}-${selected_month}`,
  );

  const total_expenses_res = await getTotalExpenses(
    selected_branch?.branch_id,
    `${selected_year}-${selected_month}`,
  );

  if (!total_sales_res.ok)
    return <ErrorComponent error={total_sales_res.error} />;

  if (!total_expenses_res.ok)
    return <ErrorComponent error={total_expenses_res.error} />;

  const total_sales = total_sales_res.value;
  const total_expenses = total_expenses_res.value;

  return (
    <div>
      <Card>
        <CardHeader>
          <SalesFilter
            branches={branches}
            selectedBranch={selected_branch}
            selectedYear={selected_year}
            selectedMonth={selected_month}
          />
        </CardHeader>
        <CardContent>
          <SalesTable sales={total_sales} expenses={total_expenses} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Page;
