import { InventoryStatus } from "src/entities/models/Inventory";
import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const updateBulkInventoryStatusUseCase = async (
  status: InventoryStatus,
  inventory_ids: string[]
) => {
  return await InventoryRepository.updateBulkInventoryStatus(
    status,
    inventory_ids
  );
};
