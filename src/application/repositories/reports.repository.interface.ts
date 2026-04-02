import {
  AuctionSalesSummaryRow,
  ExpenseSummaryRow,
  PaymentMethodBreakdownRow,
  DailyCashFlowPaymentRow,
  BidderReportRow,
  SellThroughRow,
  RefundCancellationRow,
  SupplierRevenueRow,
  ContainerStatusRow,
  PriceComparisonRow,
} from "src/entities/models/Report";

export interface IReportsRepository {
  getTotalSales: (
    branch_id: string,
    date: string,
  ) => Promise<AuctionSalesSummaryRow[]>;
  getTotalExpenses: (
    branch_id: string,
    date: string,
  ) => Promise<ExpenseSummaryRow[]>;
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
  getSupplierRevenueSummary: (
    branch_id: string,
    date: string,
  ) => Promise<SupplierRevenueRow[]>;
  getContainerStatusOverview: (
    branch_id: string,
  ) => Promise<ContainerStatusRow[]>;
  getPriceComparisonByMonth: (
    branch_id: string,
    date: string,
  ) => Promise<PriceComparisonRow[]>;
}
