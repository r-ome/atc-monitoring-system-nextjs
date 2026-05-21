import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageContainer } from "@/app/components/PageContainer";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Card } from "@/app/components/ui/card";
import { BranchBadge, StatusBadge } from "@/app/components/admin";
import { requireUser } from "@/app/lib/auth";
import { ContainerProfile } from "./components/ContainerProfile";
import { ContainerReportFiles } from "./components/ContainerReportFiles";
import { GeneratedFinalReportFiles } from "./components/GeneratedFinalReportFiles";
import { ContainerInventoriesTable } from "./components/inventories/ContainerInventoriesTable";
import { ContainerReport } from "./components/report/ContainerReport";
import { FinalReportBreakdown } from "./components/report/FinalReportBreakdown";
import { OwnerContainerReport } from "./components/report/OwnerContainerReport";
import { BoughtItemPnL } from "./components/report/BoughtItemPnL";
import { HotItemsByCategory } from "./components/report/HotItemsByCategory";
import { UpdateContainerStatusButton } from "./components/UpdateContainerStatusButton";
import { UpdateContainerModal } from "./components/UpdateContainerModal";
import { DeleteContainerModal } from "./components/DeleteContainerModal";
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
    <PageContainer>
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground 2xl:text-[14px]">
        <Link href="/containers" className="hover:text-foreground">
          Containers
        </Link>
        <ChevronRight size={12} className="opacity-60" />
        <span className="font-medium text-foreground">{container.barcode}</span>
      </nav>

      <Card className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:gap-6 sm:p-5 2xl:p-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {container.branch?.name ? (
              <BranchBadge branch={container.branch.name} />
            ) : null}
            <StatusBadge
              variant={container.status === "PAID" ? "paid" : "unpaid"}
            >
              {container.status}
            </StatusBadge>
          </div>
          <h1 className="truncate text-[18px] font-semibold tracking-tight sm:text-[22px] 2xl:text-[28px]">
            Container {container.barcode}
          </h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 [&>*]:w-full [&>*]:min-w-0 [&>*:nth-child(3)]:col-span-2 [&_button]:w-full sm:flex sm:w-auto sm:[&>*]:w-auto sm:[&>*:nth-child(3)]:col-span-1 sm:[&_button]:w-auto">
          <UpdateContainerStatusButton
            container_id={container.container_id}
            status={container.status}
            paid_at={container.paid_at}
          />
          <UpdateContainerModal container={container} />
          <DeleteContainerModal container={container} />
        </div>
      </Card>

      <Tabs defaultValue="inventory-list">
        <TabsList variant="page">
          <TabsTrigger value="inventory-list">Inventories</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
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
          <div className="flex flex-col gap-4 2xl:gap-6">
            {isOwnerContainer ? (
              <div className="grid gap-4 lg:grid-cols-2 lg:items-start 2xl:gap-6">
                <OwnerContainerReport inventories={container.inventories} />
              </div>
            ) : (
              <>
                <div className="grid gap-4 lg:grid-cols-2 lg:items-start 2xl:gap-6">
                  <ContainerReport inventories={container.inventories} />
                  <FinalReportBreakdown
                    inventories={container.inventories}
                    taxDeductionTotal={
                      container.final_report_tax_deduction_total
                    }
                    taxDeductionSource={
                      container.final_report_tax_deduction_source
                    }
                    taxDeductionItems={
                      container.final_report_tax_deduction_items
                    }
                    modifications={container.final_report_modifications}
                  />
                </div>
                <BoughtItemPnL
                  containerStatus={container.status}
                  inventories={container.inventories}
                />
              </>
            )}
              <div className="w-full rounded-lg border p-4 sm:p-6">
                <div className="space-y-6">
                  <GeneratedFinalReportFiles
                    files={container.final_report_files}
                  />
                  <ContainerReportFiles
                    container_id={container.container_id}
                    files={container.container_report_files}
                  />
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
    </PageContainer>
  );
}
