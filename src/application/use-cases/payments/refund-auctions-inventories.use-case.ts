import { RefundAuctionInventories } from "src/entities/models/Payment";
import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const refundAuctionsInventoriesUseCase = async (
  data: RefundAuctionInventories
) => {
  return await PaymentRepository.refundAuctionInventories(data);
};
