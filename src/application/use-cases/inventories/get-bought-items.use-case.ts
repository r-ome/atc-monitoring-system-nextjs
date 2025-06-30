import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const getBoughtItemsUseCase = async () => {
  return await InventoryRepository.getBoughtItems();
};
