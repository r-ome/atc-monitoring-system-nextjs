import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { ContainerProfile } from "./components/ContainerProfile";
import { ContainerInventoriesTable } from "./components/inventories/ContainerInventoriesTable";
import { getContainerByBarcode } from "@/app/(protected)/containers/actions";

export default async function ({
  params,
}: Readonly<{ params: { barcode: string } }>) {
  const { barcode } = await params;
  const container_res = await getContainerByBarcode(barcode);

  if (!container_res.ok) {
    return <div>Error Page</div>;
  }

  const container = container_res.value;

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
          />
        </TabsContent>
        <TabsContent value="profile">
          <ContainerProfile container={container} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
