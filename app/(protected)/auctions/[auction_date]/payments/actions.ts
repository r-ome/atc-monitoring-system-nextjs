"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { GetExpensesByDateController } from "src/controllers/expenses/get-expenses-by-date.controller";
import { RefundAuctionsInventoriesController } from "src/controllers/inventories/refund-auctions-inventories.controller";
import { GetAuctionTransactionsController } from "src/controllers/payments/get-auction-transactions.controller";
import { GetPaymentsByDateController } from "src/controllers/payments/get-payments-by-date.controller";
import { GetReceiptDetailsController } from "src/controllers/payments/get-receipt-details.controllers";
import { AddExpenseController } from "src/controllers/expenses/add-expense.controller";
import { GetBidderReceiptsController } from "src/controllers/payments/get-bidder-receipts.controller";
import { UpdateRegistrationPaymentController } from "src/controllers/payments/update-registration-payment.controller";
import { GetPettyCashBalanceController } from "src/controllers/expenses/get-petty-cash-balance.controller";
import { UpdateExpenseController } from "src/controllers/payments/update-expense.controller";
import { UndoPaymentController } from "src/controllers/payments/undo-payment.controller";

export const getPaymentsByDate = async (
  date: string,
  branch_id: string | undefined = undefined
) => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) redirect("/login");

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetPaymentsByDateController(new Date(date), branch_id)
  );
};

export const getAuctionTransactions = async (auction_id: string) => {
  return await GetAuctionTransactionsController(auction_id);
};

export const refundAuctionsInventories = async (formData: FormData) => {
  const input = Object.fromEntries(formData.entries());
  return await RefundAuctionsInventoriesController(input);
};

export const getReceiptDetails = async (
  auctionId: string,
  receiptNumber: string
) => {
  return await GetReceiptDetailsController(auctionId, receiptNumber);
};

export const getExpensesByDate = async (
  date: string,
  branch_id: string | undefined = undefined
) => {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) redirect("/login");
  const input = new Date(date);

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetExpensesByDateController(new Date(date), branch_id)
  );
};

export const addExpense = async (formData: FormData) => {
  const input = Object.fromEntries(formData.entries());
  return await AddExpenseController(input);
};

export const getBidderReceipts = async (auction_bidder_id: string) => {
  return await GetBidderReceiptsController(auction_bidder_id);
};

export const updateRegistrationPayment = async (
  payment_id: string,
  formData: FormData
) => {
  const input = Object.fromEntries(formData.entries());
  return await UpdateRegistrationPaymentController(payment_id, input);
};

export const getPettyCashBalance = async (date: string) => {
  const input = new Date(date);
  return await GetPettyCashBalanceController(input);
};

export const updateExpense = async (expense_id: string, formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  return await UpdateExpenseController(expense_id, data);
};

export const undoPayment = async (receipt_id: string) => {
  return await UndoPaymentController(receipt_id);
};
