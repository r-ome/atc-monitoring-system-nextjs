import { InventoryRepository } from "src/infrastructure/di/repositories";
import { ContainerRepository } from "src/infrastructure/di/repositories";

export const appendInventoriesUseCase = async (
  container_barcode: string,
  inventory_ids: string[],
) => {
  const container =
    await ContainerRepository.getInventoriesByContainerBarcode(container_barcode);

  const inventories = container.inventories.sort((a, b) =>
    a.barcode.localeCompare(b.barcode),
  );

  const last_barcode =
    inventories[inventories.length - 1].barcode.split("-")[2];

  const data = inventory_ids.map((inventory_id, i) => ({
    barcode: `${container_barcode}-${parseInt(last_barcode, 10) + i + 1}`,
    inventory_id: inventory_id,
  }));

  return InventoryRepository.appendInventories(data);
};
