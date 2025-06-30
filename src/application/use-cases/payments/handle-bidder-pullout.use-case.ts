import { PullOutPaymentInsertSchema } from "src/entities/models/Payment";
import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const handleBidderPullOutUseCase = async (
  data: PullOutPaymentInsertSchema
) => {
  return PaymentRepository.handleBidderPullOut(data);
};
