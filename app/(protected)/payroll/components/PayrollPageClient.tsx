"use client";

import { useState } from "react";
import { ChevronLeftIcon, Loader2Icon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
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
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
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
    <Tabs defaultValue="periods">
      <CardHeader className="pb-0">
        <CardTitle>
          <TabsList>
            <TabsTrigger value="periods">Payroll Periods</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
          </TabsList>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        <TabsContent value="periods">
          {selectedPeriod ? (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleBack}>
                    <ChevronLeftIcon className="h-4 w-4" />
                  </Button>
                  {selectedPeriod.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEntries ? (
                  <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    Loading entries…
                  </div>
                ) : (
                  <PayrollPeriodDetail
                    period={selectedPeriod}
                    entries={periodEntries}
                    employees={employees}
                    isAdmin={isAdmin}
                    canWrite={canWrite}
                    branchId={branchId}
                    onRefreshEntries={handleRefreshEntries}
                  />
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span>Periods</span>
                  {canWrite && (
                    <CreatePayrollPeriodModal
                      branches={branches}
                      defaultBranchId={defaultBranchId}
                      isAdmin={isAdmin}
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PayrollPeriodsTable
                  periods={periods}
                  isAdmin={isAdmin}
                  onOpen={handleOpenPeriod}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="employees">
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
        </TabsContent>
      </CardContent>
    </Tabs>
  );
};
