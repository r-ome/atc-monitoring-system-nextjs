import { AuctionWithSalesRow } from "src/entities/models/Auction";
import { ExpenseWithBranchRow } from "src/entities/models/Expense";
import {
  PaymentMethodBreakdownRow,
  DailyCashFlowPaymentRow,
  BidderReportRow,
  SellThroughRow,
  RefundCancellationRow,
} from "src/entities/models/Report";

export interface IReportsRepository {
  getTotalSales: (
    branch_id: string,
    date: string,
  ) => Promise<AuctionWithSalesRow[]>;
  getTotalExpenses: (
    branch_id: string,
    date: string,
  ) => Promise<ExpenseWithBranchRow[]>;
  getPaymentMethodBreakdown: (
    branch_id: string,
    date: string,
  ) => Promise<PaymentMethodBreakdownRow[]>;
  getDailyCashFlowPayments: (
    branch_id: string,
    date: string,
  ) => Promise<DailyCashFlowPaymentRow[]>;
  getBiddersWithAuctions: (
    branch_id: string,
    date: string,
  ) => Promise<BidderReportRow[]>;
  getAuctionInventoriesForSellThrough: (
    branch_id: string,
    date: string,
  ) => Promise<SellThroughRow[]>;
  getRefundCancellationItems: (
    branch_id: string,
    date: string,
  ) => Promise<RefundCancellationRow[]>;
}
