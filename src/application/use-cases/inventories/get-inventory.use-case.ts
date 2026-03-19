import { NotFoundError } from "src/entities/errors/common";
import { InventoryRepository } from "src/infrastructure/di/repositories";

export const getInventoryUseCase = async (inventory_id: string) => {
  const inventory = await InventoryRepository.getInventory(inventory_id);
  if (!inventory) {
    throw new NotFoundError("Inventory not found!");
  }
  return inventory;
};
