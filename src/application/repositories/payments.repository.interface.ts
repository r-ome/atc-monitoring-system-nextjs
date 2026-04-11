import {
  PullOutPaymentInput,
  RefundAuctionInventoriesInput,
  PaymentWithDetailsRow,
  PaymentWithMethodRow,
  UpdateRegistrationPaymentInput,
  ReceiptRecordRow,
  ReceiptRecordWithHistoriesRow,
  ReceiptRecordWithInventoriesRow,
  ReceiptRecordWithPaymentsRow,
  StorageFeePaymentInput,
  PullOutPaymentResult,
  UndoPaymentResult,
} from "src/entities/models/Payment";

export interface IPaymentRepository {
  getPaymentById: (payment_id: string) => Promise<PaymentWithMethodRow | null>;
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
  ) => Promise<PullOutPaymentResult>;
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
  undoPayment: (receipt_id: string) => Promise<UndoPaymentResult>;
  addStorageFee: (data: StorageFeePaymentInput) => Promise<void>;
}
