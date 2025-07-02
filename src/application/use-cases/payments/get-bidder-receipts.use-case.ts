import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const getBidderReceiptsUseCase = async (auction_bidder_id: string) => {
  return await PaymentRepository.getBidderReceipts(auction_bidder_id);
};
