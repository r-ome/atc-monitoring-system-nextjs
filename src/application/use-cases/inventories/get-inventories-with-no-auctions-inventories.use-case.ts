import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const getInventoriesWithNoAuctionsInventoriesUseCase = async () => {
  return await InventoryRepository.getInventoryWithNoAuctionInventory();
};
