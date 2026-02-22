import { RefundAuctionInventoriesInput } from "src/entities/models/Payment";
import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const refundAuctionsInventoriesUseCase = async (
  data: RefundAuctionInventoriesInput
) => {
  return await PaymentRepository.refundAuctionInventories(data);
};
