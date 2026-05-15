"use server";

import Link from "next/link";
import { ChevronLeftIcon } from "lucide-react";
import { requireSession } from "@/app/lib/auth";
import { getPayrollPeriod, getPayrollEntries } from "../actions";
import { getEmployees } from "@/app/(protected)/employees/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
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

  if (!period_res.ok) return <ErrorComponent error={{ message: "Payroll period not found." }} />;
  if (!entries_res.ok || !employees_res.ok) return <ErrorComponent error={{ message: "Server Error" }} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link href="/payroll">
              <ChevronLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          {period_res.value.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <PayrollPeriodDetail
          period={period_res.value}
          entries={entries_res.value}
          employees={employees_res.value}
          isAdmin={isAdmin}
          branchId={user.branch.branch_id}
        />
      </CardContent>
    </Card>
  );
}
