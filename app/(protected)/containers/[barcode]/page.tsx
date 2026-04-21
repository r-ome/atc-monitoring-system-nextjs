import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { requireUser } from "@/app/lib/auth";
import { ContainerProfile } from "./components/ContainerProfile";
import { ContainerInventoriesTable } from "./components/inventories/ContainerInventoriesTable";
import { getContainerByBarcode } from "@/app/(protected)/containers/actions";
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
  const tarlacBranchId = branchesRes.ok
    ? (branchesRes.value.find((branch) => branch.name === "TARLAC")
        ?.branch_id ?? null)
    : null;

  return (
    <div className="h-full w-full p-4">
      <Tabs defaultValue="inventory-list">
        <TabsList>
          <TabsTrigger value="inventory-list">Inventories</TabsTrigger>
          <TabsTrigger value="profile">Container Profile</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
