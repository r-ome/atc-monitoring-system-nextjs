import { GetSupplierReportsController } from "src/controllers/reports/get-supplier-reports.controller";
import { SupplierRevenueTable } from "./SupplierRevenueTable";
import { ContainerStatusTable } from "./ContainerStatusTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";

interface Props {
  branchId: string;
  dateParam: string;
}

export const SupplierTabContent = async ({ branchId, dateParam }: Props) => {
  const res = await GetSupplierReportsController(branchId, dateParam);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <SupplierRevenueTable data={res.value.supplierRevenue} />
      <ContainerStatusTable data={res.value.containerStatus} />
    </div>
  );
};
