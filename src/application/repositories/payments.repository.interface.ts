import {
  PullOutPaymentInput,
  RefundAuctionInventoriesInput,
  PaymentWithDetailsRow,
  UpdateRegistrationPaymentInput,
  ReceiptRecordRow,
  ReceiptRecordWithHistoriesRow,
  ReceiptRecordWithInventoriesRow,
  ReceiptRecordWithPaymentsRow,
  StorageFeePaymentInput,
} from "src/entities/models/Payment";

export interface IPaymentRepository {
  getPaymentsByDate: (
    date: Date,
    branch_id: string | undefined
  ) => Promise<PaymentWithDetailsRow[]>;
  getReceiptDetails: (
    auction_date: string,
    receipt_number: string
  ) => Promise<ReceiptRecordWithHistoriesRow>;
  getAuctionTransactions: (
    auction_id: string
  ) => Promise<ReceiptRecordWithInventoriesRow[]>;
  handleBidderPullOut: (
    data: PullOutPaymentInput
  ) => Promise<ReceiptRecordRow>;
  refundAuctionInventories: (
    data: RefundAuctionInventoriesInput,
    updated_by?: string,
  ) => Promise<void>;
  getBidderReceipts: (
    auction_bidder_id: string
  ) => Promise<ReceiptRecordWithPaymentsRow[]>;
  updateRegistrationPayment: (
    payment_id: string,
    data: UpdateRegistrationPaymentInput
  ) => Promise<void>;
  undoPayment: (receipt_id: string) => Promise<void>;
  addStorageFee: (data: StorageFeePaymentInput) => Promise<void>;
}
