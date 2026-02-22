import {
  PullOutPaymentInput,
  RefundAuctionInventoriesInput,
  ReceiptRecordWithDetailsRow,
  PaymentWithDetailsRow,
  UpdateRegistrationPaymentInput,
} from "src/entities/models/Payment";

export interface IPaymentRepository {
  getPaymentsByDate: (
    date: Date,
    branch_id: string | undefined
  ) => Promise<PaymentWithDetailsRow[]>;
  getReceiptDetails: (
    auction_date: string,
    receipt_number: string
  ) => Promise<Omit<ReceiptRecordWithDetailsRow, "auctions_inventories">>;
  getAuctionTransactions: (
    auction_id: string
  ) => Promise<Omit<ReceiptRecordWithDetailsRow, "inventory_histories">[]>;
  handleBidderPullOut: (
    data: PullOutPaymentInput
  ) => Promise<
    Omit<
      ReceiptRecordWithDetailsRow,
      | "auction_bidder"
      | "auctions_inventories"
      | "payments"
      | "inventory_histories"
    >
  >;
  refundAuctionInventories: (data: RefundAuctionInventoriesInput) => Promise<void>;
  getBidderReceipts: (
    auction_bidder_id: string
  ) => Promise<
    Omit<ReceiptRecordWithDetailsRow, "auctions_inventories" | "inventory_histories">[]
  >;
  updateRegistrationPayment: (
    payment_id: string,
    data: UpdateRegistrationPaymentInput
  ) => Promise<void>;
  undoPayment: (receipt_id: string) => Promise<void>;
}
