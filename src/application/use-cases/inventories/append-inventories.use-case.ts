import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";
import { getInventoriesByContainerBarcodeUseCase } from "../containers/get-inventories-by-container-barcode.use-case";

export const appendInventoriesUseCase = async (
  container_barcode: string,
  inventory_ids: string[],
) => {
  const container =
    await getInventoriesByContainerBarcodeUseCase(container_barcode);

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
