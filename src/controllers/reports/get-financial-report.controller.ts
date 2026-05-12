import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  BoughtItemGainRow,
  BoughtItemLossRow,
  ExpenseSummaryRow,
  FilterMode,
  OwnerOrganicSaleRow,
  PaidContainerFinancialRow,
  SalesExpensesSummary,
  SalesExpensesSummaryEntry,
  SalesExpensesSummaryTotals,
} from "src/entities/models/Report";
import { presentCashFlow } from "./get-daily-cash-flow.controller";
import { presentPaymentMethodBreakdown } from "./get-payment-method-breakdown.controller";
import { presentTotalExpenses } from "./get-total-expenses.controller";
import { presentTotalSales } from "./get-total-sales.controller";
import { formatDate } from "@/app/lib/utils";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

function computeRoyalty(sales: number): number {
  if (sales < 450_000) return 20_000;
  if (sales < 500_000) return 22_000;
  if (sales < 550_000) return 25_000;
  if (sales < 700_000) return 30_000;
  if (sales < 800_000) return 32_000;
  return 35_000;
}

function computeSalesCommission(sales: number): number {
  if (sales < 700_000) return Math.round(sales * 0.25);
  if (sales <= 799_999) return Math.round(sales * 0.2);
  return Math.round(sales * 0.15);
}

function emptyTotals(): SalesExpensesSummaryTotals {
  return {
    total_income: 0,
    sales_commission: 0,
    service_charge: 0,
    bought_items_profit_loss: 0,
    owner_sales_00: 0,
    sorting_preparation_fee: 0,
    total_expenses: 0,
    expenses: 0,
    atc_group_commission: 0,
    royalty: 0,
    net_income: 0,
  };
}

function getWeekBucket(date: Date) {
  const [year, month, day] = formatDate(date, "yyyy-MM-dd")
    .split("-")
    .map(Number);
  const manilaDate = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = manilaDate.getUTCDay();
  const weekStart = new Date(manilaDate);
  weekStart.setUTCDate(manilaDate.getUTCDate() - dayOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const clampedStart = weekStart < yearStart ? yearStart : weekStart;
  const clampedEnd = weekEnd > yearEnd ? yearEnd : weekEnd;
  const startLabel = `${MONTH_LABELS[clampedStart.getUTCMonth()]} ${clampedStart.getUTCDate()}`;
  const endLabel = `${MONTH_LABELS[clampedEnd.getUTCMonth()]} ${clampedEnd.getUTCDate()}`;
  const keyYear = clampedStart.getUTCFullYear();
  const keyMonth = String(clampedStart.getUTCMonth() + 1).padStart(2, "0");
  const keyDay = String(clampedStart.getUTCDate()).padStart(2, "0");

  return {
    key: `${keyYear}-${keyMonth}-${keyDay}`,
    label: `${startLabel} - ${endLabel}`,
  };
}

function getBucket(date: Date, mode: FilterMode) {
  if (mode === "monthly") {
    return {
      key: String(date.getMonth()).padStart(2, "0"),
      period: MONTHS[date.getMonth()],
    };
  }

  if (mode === "weekly") {
    const week = getWeekBucket(date);
    return { key: week.key, period: week.label };
  }

  return {
    key: formatDate(date, "yyyy-MM-dd"),
    period: formatDate(date, "MMM dd, yyyy"),
  };
}

function finalizeTotals(totals: SalesExpensesSummaryTotals) {
  totals.total_income =
    totals.sales_commission +
    totals.service_charge +
    totals.bought_items_profit_loss +
    totals.owner_sales_00 +
    totals.sorting_preparation_fee;
  totals.total_expenses =
    totals.expenses + totals.atc_group_commission + totals.royalty;
  totals.net_income = totals.total_income - totals.total_expenses;
}

function addTotals(
  target: SalesExpensesSummaryTotals,
  source: SalesExpensesSummaryTotals,
) {
  target.sales_commission += source.sales_commission;
  target.service_charge += source.service_charge;
  target.bought_items_profit_loss += source.bought_items_profit_loss;
  target.owner_sales_00 += source.owner_sales_00;
  target.sorting_preparation_fee += source.sorting_preparation_fee;
  target.expenses += source.expenses;
  target.atc_group_commission += source.atc_group_commission;
  target.royalty += source.royalty;
}

export function presentSalesExpensesSummary(
  containers: PaidContainerFinancialRow[],
  expenses: ExpenseSummaryRow[],
  boughtItemLosses: BoughtItemLossRow[],
  boughtItemGains: BoughtItemGainRow[],
  ownerOrganicSales: OwnerOrganicSaleRow[],
  mode: FilterMode,
): SalesExpensesSummary {
  const buckets = new Map<string, SalesExpensesSummaryEntry>();
  const totals = emptyTotals();

  function getEntry(date: Date): SalesExpensesSummaryEntry {
    const { key, period } = getBucket(date, mode);
    const existing = buckets.get(key);
    if (existing) return existing;

    const entry = { key, period, ...emptyTotals(), paid_containers: [] };
    buckets.set(key, entry);
    return entry;
  }

  for (const container of containers) {
    const sales_commission = computeSalesCommission(container.total_item_sales);
    const service_charge = container.total_service_charge;
    const sorting_preparation_fee = Math.round(container.total_item_sales * 0.05);
    const atc_group_commission = Math.round(sales_commission / 3);
    const royalty = computeRoyalty(container.total_item_sales);
    const entry = getEntry(container.paid_at);

    entry.sales_commission += sales_commission;
    entry.service_charge += service_charge;
    entry.sorting_preparation_fee += sorting_preparation_fee;
    entry.atc_group_commission += atc_group_commission;
    entry.royalty += royalty;
    entry.paid_containers.push({
      barcode: container.barcode,
      total_item_sales: container.total_item_sales,
      total_service_charge: container.total_service_charge,
    });
  }

  for (const loss of boughtItemLosses) {
    const entry = getEntry(loss.paid_at);
    entry.bought_items_profit_loss -= loss.declared_price;
  }

  for (const gain of boughtItemGains) {
    const entry = getEntry(gain.auction_date);
    entry.bought_items_profit_loss += gain.price;
  }

  for (const sale of ownerOrganicSales) {
    const entry = getEntry(sale.auction_date);
    entry.owner_sales_00 += sale.price;
  }

  for (const expense of expenses) {
    const entry = getEntry(expense.created_at);
    entry.expenses += expense.total_amount;
  }

  const breakdown = Array.from(buckets.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((entry) => {
      finalizeTotals(entry);
      addTotals(totals, entry);
      return entry;
    });

  finalizeTotals(totals);

  return { totals, breakdown };
}

export const GetFinancialReportController = async (
  branch_id: string,
  date: string,
  mode: FilterMode,
) => {
  try {
    const [
      salesRows,
      expenseRows,
      containerFinancialRows,
      boughtItemLossRows,
      boughtItemGainRows,
      ownerOrganicSaleRows,
      paymentRows,
      cashFlowRows,
    ] = await Promise.all([
      ReportsRepository.getTotalSales(branch_id, date),
      ReportsRepository.getTotalExpenses(branch_id, date),
      ReportsRepository.getPaidContainerFinancials(branch_id, date),
      ReportsRepository.getBoughtItemLossEvents(branch_id, date),
      ReportsRepository.getBoughtItemGainEvents(branch_id, date),
      ReportsRepository.getOwnerOrganicSales(branch_id, date),
      ReportsRepository.getPaymentMethodBreakdown(branch_id, date),
      ReportsRepository.getDailyCashFlowPayments(branch_id, date),
    ]);

    return ok({
      sales: presentTotalSales(salesRows, mode),
      expenses: presentTotalExpenses(expenseRows, mode),
      salesExpensesSummary: presentSalesExpensesSummary(
        containerFinancialRows,
        expenseRows,
        boughtItemLossRows,
        boughtItemGainRows,
        ownerOrganicSaleRows,
        mode,
      ),
      paymentMethodBreakdown: presentPaymentMethodBreakdown(paymentRows),
      cashFlow: presentCashFlow(cashFlowRows, expenseRows, mode),
    });
  } catch (error) {
    logger("GetFinancialReportController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Failed to load financial reports", cause: error.message });
    }

    return err({
      message: "Failed to load financial reports",
      cause: "Server Error",
    });
  }
};
