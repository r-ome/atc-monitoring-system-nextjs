"use server";

import { requireSession } from "@/app/lib/auth";
import { getBranches } from "@/app/(protected)/branches/actions";
import { getEmployees } from "@/app/(protected)/employees/actions";
import { getPayrollPeriods } from "./actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card } from "@/app/components/ui/card";
import { PayrollPageClient } from "./components/PayrollPageClient";

export default async function PayrollPage() {
  const session = await requireSession();
  const { user } = session;
  const isAdmin = ["SUPER_ADMIN", "OWNER"].includes(user.role);
  const canWrite = ["SUPER_ADMIN", "OWNER", "CASHIER"].includes(user.role);

  const [branches_res, periods_res, employees_res] = await Promise.all([
    getBranches(),
    getPayrollPeriods(isAdmin ? undefined : user.branch.branch_id),
    getEmployees(isAdmin ? undefined : user.branch.branch_id),
  ]);

  if (!branches_res.ok || !periods_res.ok || !employees_res.ok) {
    return <ErrorComponent error={{ message: "Server Error" }} />;
  }

  const defaultBranchId = isAdmin
    ? (branches_res.value.find((b) => b.name === "BIÑAN")?.branch_id ?? branches_res.value[0]?.branch_id ?? "")
    : user.branch.branch_id;

  return (
    <Card>
      <PayrollPageClient
        periods={periods_res.value}
        employees={employees_res.value}
        branches={branches_res.value}
        isAdmin={isAdmin}
        canWrite={canWrite}
        defaultBranchId={defaultBranchId}
        branchId={user.branch.branch_id}
      />
    </Card>
  );
}
