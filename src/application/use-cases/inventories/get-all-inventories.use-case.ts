import { INVENTORY_STATUS } from "src/entities/models/Inventory";
import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const getAllInventoriesUseCase = async (status?: INVENTORY_STATUS[]) => {
  return await InventoryRepository.getAllInventories(status);
};
