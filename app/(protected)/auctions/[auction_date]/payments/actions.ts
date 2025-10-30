"use server";

import { GetExpensesByDateController } from "src/controllers/expenses/get-expenses-by-date.controller";
import { RefundAuctionsInventoriesController } from "src/controllers/inventories/refund-auctions-inventories.controller";
import { GetAuctionTransactionsController } from "src/controllers/payments/get-auction-transactions.controller";
import { GetPaymentsByDateController } from "src/controllers/payments/get-payments-by-date.controller";
import { GetReceiptDetailsController } from "src/controllers/payments/get-receipt-details.controllers";
import { AddExpenseController } from "src/controllers/expenses/add-expense.controller";
import { GetBidderReceiptsController } from "src/controllers/payments/get-bidder-receipts.controller";
import { UpdateRegistrationPaymentController } from "src/controllers/payments/update-registration-payment.controller";

export const getPaymentsByDate = async (date: string) => {
  const input = new Date(date);
  return await GetPaymentsByDateController(input);
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

export const getExpensesByDate = async (date: string) => {
  const input = new Date(date);
  return await GetExpensesByDateController(input);
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
