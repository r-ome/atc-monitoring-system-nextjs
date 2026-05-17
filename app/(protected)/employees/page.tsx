"use server";

import { UserSquare2 } from "lucide-react";
import { requireSession } from "@/app/lib/auth";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { Card } from "@/app/components/ui/card";
import { getBranches } from "@/app/(protected)/branches/actions";
import { getEmployees } from "./actions";
import { EmployeesTable } from "./EmployeesTable";
import { CreateEmployeeModal } from "./CreateEmployeeModal";

export default async function Page({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | undefined>>;
}>) {
  const session = await requireSession();
  const { user } = session;

  const isAdmin = ["SUPER_ADMIN", "OWNER"].includes(user.role);
  const canWrite = isAdmin;

  const [branches_res, employees_res] = await Promise.all([
    getBranches(),
    getEmployees(isAdmin ? undefined : user.branch.branch_id),
  ]);

  if (!branches_res.ok || !employees_res.ok) {
    return <ErrorComponent error={{ message: "Server Error" }} />;
  }

  const branches = branches_res.value;
  const employees = employees_res.value;

  const defaultBranchId = isAdmin
    ? (branches.find((b) => b.name === "BIÑAN")?.branch_id ?? branches[0]?.branch_id ?? "")
    : user.branch.branch_id;

  return (
    <PageContainer>
      <PageHeader
        title="Employees"
        subtitle="Manage employee records and assignments"
        actions={
          canWrite ? (
            <CreateEmployeeModal
              branches={branches}
              defaultBranchId={defaultBranchId}
              isAdmin={isAdmin}
            />
          ) : null
        }
      />

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <UserSquare2 size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            All Employees
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[15px]">
            {employees.length.toLocaleString()} total
          </span>
        </div>

        <EmployeesTable
          employees={employees}
          branches={branches}
          isAdmin={canWrite}
        />
      </Card>
    </PageContainer>
  );
}
