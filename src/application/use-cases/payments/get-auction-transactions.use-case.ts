import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const getAuctionTransactionsUseCase = async (auction_id: string) => {
  return PaymentRepository.getAuctionTransactions(auction_id);
};
