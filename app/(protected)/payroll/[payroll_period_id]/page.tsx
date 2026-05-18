"use server";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { requireSession } from "@/app/lib/auth";
import { getPayrollPeriod, getPayrollEntries } from "../actions";
import { getEmployees } from "@/app/(protected)/employees/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PayrollPeriodDetail } from "./components/PayrollPeriodDetail";

export default async function PayrollPeriodPage({
  params,
}: {
  params: Promise<{ payroll_period_id: string }>;
}) {
  const { payroll_period_id } = await params;
  const session = await requireSession();
  const { user } = session;
  const isAdmin = ["SUPER_ADMIN", "OWNER"].includes(user.role);

  const [period_res, entries_res, employees_res] = await Promise.all([
    getPayrollPeriod(payroll_period_id),
    getPayrollEntries(payroll_period_id),
    getEmployees(isAdmin ? undefined : user.branch.branch_id),
  ]);

  if (!period_res.ok)
    return <ErrorComponent error={{ message: "Payroll period not found." }} />;
  if (!entries_res.ok || !employees_res.ok)
    return <ErrorComponent error={{ message: "Server Error" }} />;

  const period = period_res.value;

  return (
    <PageContainer>
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground 2xl:text-[14px]">
        <Link href="/payroll" className="hover:text-foreground">
          Payroll
        </Link>
        <ChevronRight size={12} className="opacity-60" />
        <span className="font-medium text-foreground">{period.label}</span>
      </nav>

      <PayrollPeriodDetail
        period={period}
        entries={entries_res.value}
        employees={employees_res.value}
        isAdmin={isAdmin}
        branchId={user.branch.branch_id}
      />
    </PageContainer>
  );
}
