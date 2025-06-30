import { PaymentRepository } from "src/infrastructure/repositories/payments.repository";

export const getReceiptDetailsUseCase = async (
  auction_id: string,
  receipt_number: string
) => {
  return await PaymentRepository.getReceiptDetails(auction_id, receipt_number);
};
