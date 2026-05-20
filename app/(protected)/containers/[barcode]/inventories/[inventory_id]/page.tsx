import { getInventory } from "@/app/(protected)/inventories/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { UpdateInventoryModal } from "./UpdateInventoryModal";
import { DeleteInventoryModal } from "./DeleteInventoryModal";
import { InventoryProfileView } from "./InventoryProfileView";
import { InventoryBreadcrumb } from "./InventoryBreadcrumb";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ inventory_id: string }> }>) {
  const { inventory_id } = await params;
  const res = await getInventory(inventory_id);
  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const inventory = res.value;
  return (
    <div className="flex flex-col gap-4">
      <InventoryBreadcrumb
        containerBarcode={inventory.container.barcode}
        inventoryBarcode={inventory.barcode}
      />
      <InventoryProfileView
        inventory={inventory}
        actions={
          <>
            <UpdateInventoryModal inventory={inventory} />
            <DeleteInventoryModal inventory={inventory} />
          </>
        }
      />
    </div>
  );
}
