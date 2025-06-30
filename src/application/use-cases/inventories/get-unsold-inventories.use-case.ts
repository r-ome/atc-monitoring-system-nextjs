import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const getUnsoldInventoriesUseCase = async () => {
  return InventoryRepository.getUnsoldInventories();
};
