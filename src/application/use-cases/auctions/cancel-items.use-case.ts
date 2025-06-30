import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import { CancelItemsSchema } from "src/entities/models/Inventory";

export const cancelItemsUseCase = async (input: CancelItemsSchema) => {
  return await AuctionRepository.cancelItems(input);
};
