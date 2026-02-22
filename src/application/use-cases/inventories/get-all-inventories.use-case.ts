import { InventoryStatus } from "src/entities/models/Inventory";
import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const getAllInventoriesUseCase = async (status?: InventoryStatus[]) => {
  return await InventoryRepository.getAllInventories(status);
};
