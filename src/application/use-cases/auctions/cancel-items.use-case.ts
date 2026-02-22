import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import { CancelItemsInput } from "src/entities/models/Inventory";

export const cancelItemsUseCase = async (input: CancelItemsInput) => {
  return await AuctionRepository.cancelItems(input);
};
