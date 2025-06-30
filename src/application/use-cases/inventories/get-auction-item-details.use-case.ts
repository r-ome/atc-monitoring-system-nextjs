import { NotFoundError } from "src/entities/errors/common";
import { InventoryRepository } from "src/infrastructure/repositories/inventories.repository";

export const getAuctionItemDetailsUseCase = async (
  auction_inventory_id: string
) => {
  const auction_inventory = await InventoryRepository.getAuctionItemDetails(
    auction_inventory_id
  );

  if (!auction_inventory) {
    throw new NotFoundError("Auction Item does not exist!");
  }

  return auction_inventory;
};
