import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";
import { MergeInventoriesInput } from "src/entities/models/Inventory";

export const mergeInventoriesUseCase = async (data: MergeInventoriesInput) => {
  return InventoryRepository.mergeInventories(data);
};
