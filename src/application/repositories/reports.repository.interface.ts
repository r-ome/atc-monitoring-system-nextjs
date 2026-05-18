import {
  AuctionKpiRow,
  AuctionSalesSummaryRow,
  BoughtItemGainRow,
  BoughtItemLossRow,
  ExpenseSummaryDetailRow,
  ExpenseSummaryRow,
  OwnerOrganicSaleRow,
  PaidContainerFinancialRow,
  BidderReportRow,
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
  getTotalSalaries: (
    branch_id: string,
    date: string,
  ) => Promise<ExpenseSummaryRow[]>;
  getExpensesSummary: (
    branch_id: string,
    date: string,
  ) => Promise<ExpenseSummaryDetailRow[]>;
  getPaidContainerFinancials: (
    branch_id: string,
    date: string,
  ) => Promise<PaidContainerFinancialRow[]>;
  getBoughtItemLossEvents: (
    branch_id: string,
    date: string,
  ) => Promise<BoughtItemLossRow[]>;
  getBoughtItemGainEvents: (
    branch_id: string,
    date: string,
  ) => Promise<BoughtItemGainRow[]>;
  getOwnerOrganicSales: (
    branch_id: string,
    date: string,
  ) => Promise<OwnerOrganicSaleRow[]>;
  getBiddersWithAuctions: (
    branch_id: string,
    date: string,
  ) => Promise<BidderReportRow[]>;
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
  getAuctionKpis: (
    branch_id: string,
    year: string,
  ) => Promise<AuctionKpiRow[]>;
}
