import { PullOutPaymentInput } from "src/entities/models/Payment";
import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const handleBidderPullOutUseCase = async (
  data: PullOutPaymentInput
) => {
  return PaymentRepository.handleBidderPullOut(data);
};
