import {
  PullOutPaymentInsertSchema,
  RefundAuctionInventories,
  ReceiptRecordsSchema,
  PaymentSchema,
  RegistrationPaymentUpdateSchema,
} from "src/entities/models/Payment";

export interface IPaymentRepository {
  getPaymentsByDate: (date: Date) => Promise<PaymentSchema[]>;
  getReceiptDetails: (
    auction_date: string,
    receipt_number: string
  ) => Promise<Omit<ReceiptRecordsSchema, "auctions_inventories">>;
  getAuctionTransactions: (
    auction_id: string
  ) => Promise<Omit<ReceiptRecordsSchema, "inventory_histories">[]>;
  handleBidderPullOut: (
    data: PullOutPaymentInsertSchema
  ) => Promise<
    Omit<
      ReceiptRecordsSchema,
      | "auction_bidder"
      | "auctions_inventories"
      | "payments"
      | "inventory_histories"
    >
  >;
  refundAuctionInventories: (data: RefundAuctionInventories) => Promise<void>;
  getBidderReceipts: (
    auction_bidder_id: string
  ) => Promise<
    Omit<ReceiptRecordsSchema, "auctions_inventories" | "inventory_histories">[]
  >;
  updateRegistrationPayment: (
    payment_id: string,
    data: RegistrationPaymentUpdateSchema
  ) => Promise<void>;
}
