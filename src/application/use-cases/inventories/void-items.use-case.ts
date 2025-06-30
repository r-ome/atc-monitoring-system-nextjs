import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const voidItemsUseCase = async (data: {
  auction_inventories: {
    auction_inventory_id: string;
    inventory_id: string;
  }[];
  reason: string;
}) => {
  return await InventoryRepository.voidItems(data);
};
