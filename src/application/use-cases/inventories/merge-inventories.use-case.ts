import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";
import { InventoryMergeSchema } from "src/entities/models/Inventory";

export const mergeInventoriesUseCase = async (data: InventoryMergeSchema) => {
  return InventoryRepository.mergeInventories(data);
};
