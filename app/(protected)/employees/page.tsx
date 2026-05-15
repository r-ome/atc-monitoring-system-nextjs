"use server";

import { requireSession } from "@/app/lib/auth";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getBranches } from "@/app/(protected)/branches/actions";
import { getEmployees } from "./actions";
import { EmployeesTable } from "./EmployeesTable";
import { CreateEmployeeModal } from "./CreateEmployeeModal";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle>Employees</CardTitle>
      </CardHeader>
      <CardContent>
        <EmployeesTable
          employees={employees}
          branches={branches}
          isAdmin={canWrite}
          actionButtons={canWrite && (
            <CreateEmployeeModal
              branches={branches}
              defaultBranchId={defaultBranchId}
              isAdmin={isAdmin}
            />
          )}
        />
      </CardContent>
    </Card>
  );
}
