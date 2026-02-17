import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const deleteInventoryUseCase = async (inventory_id: string) => {
  return InventoryRepository.deleteInventory(inventory_id);
};
