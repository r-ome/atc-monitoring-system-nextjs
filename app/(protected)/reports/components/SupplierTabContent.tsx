import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { presentSupplierRevenue } from "src/controllers/reports/get-supplier-revenue.controller";
import { presentContainerStatus } from "src/controllers/reports/get-container-status.controller";
import { SupplierRevenueTable } from "./SupplierRevenueTable";
import { ContainerStatusTable } from "./ContainerStatusTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";

interface Props {
  branchId: string;
  dateParam: string;
}

export const SupplierTabContent = async ({ branchId, dateParam }: Props) => {
  try {
    const [supplierRows, containerRows] = await Promise.all([
      ReportsRepository.getSupplierRevenueSummary(branchId, dateParam),
      ReportsRepository.getContainerStatusOverview(branchId),
    ]);

    return (
      <div className="flex flex-col gap-4 pt-2">
        <Card>
          <CardHeader><CardTitle>Supplier Revenue Summary</CardTitle></CardHeader>
          <CardContent>
            <SupplierRevenueTable data={presentSupplierRevenue(supplierRows)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Container Status Overview</CardTitle></CardHeader>
          <CardContent>
            <ContainerStatusTable data={presentContainerStatus(containerRows)} />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    const cause = error instanceof DatabaseOperationError ? error.message : "Server Error";
    return <ErrorComponent error={{ message: "Failed to load supplier reports", cause }} />;
  }
};
