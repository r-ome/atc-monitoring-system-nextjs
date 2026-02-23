"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetExpensesByDateController } from "src/controllers/expenses/get-expenses-by-date.controller";
import { RefundAuctionsInventoriesController } from "src/controllers/inventories/refund-auctions-inventories.controller";
import { GetAuctionTransactionsController } from "src/controllers/payments/get-auction-transactions.controller";
import { GetPaymentsByDateController } from "src/controllers/payments/get-payments-by-date.controller";
import { GetReceiptDetailsController } from "src/controllers/payments/get-receipt-details.controller";
import { AddExpenseController } from "src/controllers/expenses/add-expense.controller";
import { GetBidderReceiptsController } from "src/controllers/payments/get-bidder-receipts.controller";
import { UpdateRegistrationPaymentController } from "src/controllers/payments/update-registration-payment.controller";
import { GetPettyCashBalanceController } from "src/controllers/expenses/get-petty-cash-balance.controller";
import { UpdateExpenseController } from "src/controllers/payments/update-expense.controller";
import { UndoPaymentController } from "src/controllers/payments/undo-payment.controller";
import { UpdatePettyCashController } from "src/controllers/expenses/update-petty-cash.controller";
import { DeleteExpenseController } from "src/controllers/expenses/delete-expense.controller";
import { PettyCash } from "src/entities/models/Expense";
import { RecalculatePettyCashController } from "src/controllers/payments/recalculate-petty-cash.controller";

export const getPaymentsByDate = async (
  date: string,
  branch_id: string | undefined = undefined,
) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetPaymentsByDateController(new Date(date), branch_id),
  );
};

export const getAuctionTransactions = async (auction_id: string) => {
  return await GetAuctionTransactionsController(auction_id);
};

export const refundAuctionsInventories = async (form_data: FormData) => {
  const input = Object.fromEntries(form_data.entries());
  return await RefundAuctionsInventoriesController(input);
};

export const getReceiptDetails = async (
  auctionId: string,
  receiptNumber: string,
) => {
  return await GetReceiptDetailsController(auctionId, receiptNumber);
};

export const getExpensesByDate = async (
  date: string,
  branch_id: string | undefined = undefined,
) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetExpensesByDateController(date, branch_id),
  );
};

export const addExpense = async (
  petty_cash_id: string,
  form_data: FormData,
) => {
  const user = await requireUser();
  const input = Object.fromEntries(form_data.entries());

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await AddExpenseController(petty_cash_id, input),
  );
};

export const getBidderReceipts = async (auction_bidder_id: string) => {
  return await GetBidderReceiptsController(auction_bidder_id);
};

export const updateRegistrationPayment = async (
  payment_id: string,
  form_data: FormData,
) => {
  const input = Object.fromEntries(form_data.entries());
  return await UpdateRegistrationPaymentController(payment_id, input);
};

export const getPettyCashBalance = async (
  date: string,
  branch_id: string | undefined,
) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetPettyCashBalanceController(date, branch_id),
  );
};

export const updateExpense = async (
  expense_id: string,
  form_data: FormData,
) => {
  const data = Object.fromEntries(form_data.entries());
  return await UpdateExpenseController(expense_id, data);
};

export const undoPayment = async (receipt_id: string) => {
  return await UndoPaymentController(receipt_id);
};

export const updatePettyCash = async (
  petty_cash_id: string,
  form_data: FormData,
) => {
  const user = await requireUser();
  const input = Object.fromEntries(form_data.entries());

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await UpdatePettyCashController(petty_cash_id, input),
  );
};

export const deleteExpense = async (expense_id: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await DeleteExpenseController(expense_id),
  );
};

export const recalculatePettyCash = async (petty_cash: PettyCash) => {
  const user = await requireUser();

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await RecalculatePettyCashController(petty_cash),
  );
};
