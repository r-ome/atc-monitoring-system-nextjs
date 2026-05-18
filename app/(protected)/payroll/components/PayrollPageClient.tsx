"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Card } from "@/app/components/ui/card";
import { PayrollPeriodsTable } from "./PayrollPeriodsTable";
import { CreatePayrollPeriodModal } from "./CreatePayrollPeriodModal";
import { EmployeesTable } from "@/app/(protected)/employees/EmployeesTable";
import { CreateEmployeeModal } from "@/app/(protected)/employees/CreateEmployeeModal";
import { PayrollPeriodDetail } from "../[payroll_period_id]/components/PayrollPeriodDetail";
import { getPayrollEntries } from "../actions";
import type { PayrollPeriod } from "src/entities/models/PayrollPeriod";
import type { PayrollEntry } from "src/entities/models/PayrollEntry";
import type { Employee } from "src/entities/models/Employee";
import type { Branch } from "src/entities/models/Branch";

interface Props {
  periods: PayrollPeriod[];
  employees: Employee[];
  branches: Branch[];
  isAdmin: boolean;
  canWrite: boolean;
  defaultBranchId: string;
  branchId: string;
}

export const PayrollPageClient: React.FC<Props> = ({
  periods,
  employees,
  branches,
  isAdmin,
  canWrite,
  defaultBranchId,
  branchId,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(
    null,
  );
  const [periodEntries, setPeriodEntries] = useState<PayrollEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);

  const handleOpenPeriod = async (period: PayrollPeriod) => {
    setLoadingEntries(true);
    setSelectedPeriod(period);
    const res = await getPayrollEntries(period.payroll_period_id);
    if (res.ok) setPeriodEntries(res.value);
    setLoadingEntries(false);
  };

  const handleRefreshEntries = async () => {
    if (!selectedPeriod) return;
    const res = await getPayrollEntries(selectedPeriod.payroll_period_id);
    if (res.ok) setPeriodEntries(res.value);
  };

  const handleBack = () => {
    setSelectedPeriod(null);
    setPeriodEntries([]);
  };

  return (
    <Tabs defaultValue="periods" className="flex flex-col gap-4 2xl:gap-6">
      <TabsList variant="page">
        <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
        <TabsTrigger value="employees">Employees</TabsTrigger>
      </TabsList>

      <TabsContent value="periods" className="flex flex-col gap-4 2xl:gap-6">
        {selectedPeriod ? (
          loadingEntries ? (
            <Card className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              Loading entries…
            </Card>
          ) : (
            <PayrollPeriodDetail
              period={selectedPeriod}
              entries={periodEntries}
              employees={employees}
              isAdmin={isAdmin}
              canWrite={canWrite}
              branchId={branchId}
              onRefreshEntries={handleRefreshEntries}
              onBack={handleBack}
            />
          )
        ) : (
          <PayrollPeriodsTable
            periods={periods}
            isAdmin={isAdmin}
            onOpen={handleOpenPeriod}
            actionButtons={
              canWrite ? (
                <CreatePayrollPeriodModal
                  branches={branches}
                  defaultBranchId={defaultBranchId}
                  isAdmin={isAdmin}
                />
              ) : null
            }
          />
        )}
      </TabsContent>

      <TabsContent value="employees">
        <EmployeesTable
          chrome
          employees={employees}
          branches={branches}
          isAdmin={canWrite}
          actionButtons={
            canWrite ? (
              <CreateEmployeeModal
                branches={branches}
                defaultBranchId={defaultBranchId}
                isAdmin={isAdmin}
              />
            ) : null
          }
        />
      </TabsContent>
    </Tabs>
  );
};
