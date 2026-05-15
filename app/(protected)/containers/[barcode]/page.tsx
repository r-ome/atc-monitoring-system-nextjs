import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { requireUser } from "@/app/lib/auth";
import { ContainerProfile } from "./components/ContainerProfile";
import { ContainerReportFiles } from "./components/ContainerReportFiles";
import { GeneratedFinalReportFiles } from "./components/GeneratedFinalReportFiles";
import { ContainerInventoriesTable } from "./components/inventories/ContainerInventoriesTable";
import { ContainerReport } from "./components/report/ContainerReport";
import { OwnerContainerReport } from "./components/report/OwnerContainerReport";
import { BoughtItemPnL } from "./components/report/BoughtItemPnL";
import { HotItemsByCategory } from "./components/report/HotItemsByCategory";
import {
  getContainerByBarcode,
  getContainerHotItemCategories,
} from "@/app/(protected)/containers/actions";
import { getBranches } from "@/app/(protected)/branches/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ barcode: string }> }>) {
  const { barcode } = await params;
  const user = await requireUser();
  const [res, branchesRes] = await Promise.all([
    getContainerByBarcode(barcode),
    getBranches(),
  ]);

  if (!res.ok) {
    return (
      <div>
        <ErrorComponent error={res.error} />
      </div>
    );
  }

  const container = res.value;
  const hotItemsRes = await getContainerHotItemCategories({
    container_id: container.container_id,
  });
  const tarlacBranchId = branchesRes.ok
    ? (branchesRes.value.find((branch) => branch.name === "TARLAC")
        ?.branch_id ?? null)
    : null;
  const isOwnerContainer =
    container.barcode.startsWith("00") ||
    container.barcode.toUpperCase().startsWith("T0");

  return (
    <div className="h-full w-full p-4">
      <Tabs defaultValue="inventory-list">
        <TabsList>
          <TabsTrigger value="inventory-list">Inventories</TabsTrigger>
          <TabsTrigger value="profile">Container Profile</TabsTrigger>
          <TabsTrigger value="report">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="inventory-list">
          <ContainerInventoriesTable
            inventories={container.inventories}
            container={container}
            userBranchId={user.branch.branch_id}
            tarlacBranchId={tarlacBranchId}
          />
        </TabsContent>
        <TabsContent value="profile">
          <ContainerProfile container={container} />
        </TabsContent>
        <TabsContent value="report">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
              {isOwnerContainer ? (
                <OwnerContainerReport inventories={container.inventories} />
              ) : (
                <div className="space-y-6">
                  <ContainerReport inventories={container.inventories} />
                  <BoughtItemPnL
                    containerStatus={container.status}
                    inventories={container.inventories}
                  />
                </div>
              )}
              <div className="w-full max-w-lg rounded-lg border p-6">
                <div className="space-y-6">
                  <GeneratedFinalReportFiles files={container.final_report_files} />
                  <ContainerReportFiles
                    container_id={container.container_id}
                    files={container.container_report_files}
                  />
                </div>
              </div>
            </div>
            {hotItemsRes.ok ? (
              <HotItemsByCategory
                containerId={container.container_id}
                initialReport={hotItemsRes.value}
              />
            ) : (
              <ErrorComponent error={hotItemsRes.error} />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
