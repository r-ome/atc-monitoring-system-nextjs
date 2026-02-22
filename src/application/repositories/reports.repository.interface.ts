import { AuctionSalesSchema } from "src/entities/models/Auction";
import { ExpenseWithBranchRow } from "src/entities/models/Expense";

export interface IReportsRepository {
  getTotalSales: (
    branch_id: string,
    date: string,
  ) => Promise<AuctionSalesSchema[]>;
  getTotalExpenses: (
    branch_id: string,
    date: string,
  ) => Promise<ExpenseWithBranchRow[]>;
}
