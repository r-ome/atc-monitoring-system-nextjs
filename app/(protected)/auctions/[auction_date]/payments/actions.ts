"use server";

import {
  authorizeAction,
  runWithBranchContext,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { GetExpensesByDateController } from "src/controllers/expenses/get-expenses-by-date.controller";
import { RefundAuctionsInventoriesController } from "src/controllers/inventories/refund-auctions-inventories.controller";
import { GetAuctionTransactionsController } from "src/controllers/payments/get-auction-transactions.controller";
import { GetPaymentsByDateController } from "src/controllers/payments/get-payments-by-date.controller";
import { GetReceiptDetailsController } from "src/controllers/payments/get-receipt-details.controller";
import { AddExpenseController } from "src/controllers/expenses/add-expense.controller";
import { GetBidderReceiptsController } from "src/controllers/payments/get-bidder-receipts.controller";
import { UpdateRegistrationPaymentController } from "src/controllers/payments/update-registration-payment.controller";
import { GetPettyCashBalanceController } from "src/controllers/expenses/get-petty-cash-balance.controller";
import { UpdateExpenseController } from "src/controllers/expenses/update-expense.controller";
import { UndoPaymentController } from "src/controllers/payments/undo-payment.controller";
import { AddStorageFeeController } from "src/controllers/payments/add-storage-fee.controller";
import { StorageFeePaymentInput } from "src/entities/models/Payment";
import prisma from "@/app/lib/prisma/prisma";
import { UpdatePettyCashController } from "src/controllers/expenses/update-petty-cash.controller";
import { DeleteExpenseController } from "src/controllers/expenses/delete-expense.controller";
import { PettyCash, PettyCashSnapshot } from "src/entities/models/Expense";
import { RecalculatePettyCashController } from "src/controllers/expenses/recalculate-petty-cash.controller";
import { CheckPettyCashConsistencyController } from "src/controllers/expenses/check-petty-cash-consistency.controller";
import { RepairPettyCashConsistencyController } from "src/controllers/expenses/repair-petty-cash-consistency.controller";
import { UndoPettyCashRepairController } from "src/controllers/expenses/undo-petty-cash-repair.controller";

export const getPaymentsByDate = async (
  date: string,
  branch_id: string | undefined = undefined,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetPaymentsByDateController(new Date(date), branch_id),
  );
};

export const getAuctionTransactions = async (auction_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetAuctionTransactionsController(auction_id),
  );
};

export const refundAuctionsInventories = async (form_data: FormData) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const input = Object.fromEntries(form_data.entries());

  return await runWithUserContext(
    auth.value,
    async () => await RefundAuctionsInventoriesController(input),
  );
};

export const getReceiptDetails = async (
  auctionId: string,
  receiptNumber: string,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetReceiptDetailsController(auctionId, receiptNumber),
  );
};

export const getExpensesByDate = async (
  date: string,
  branch_id: string | undefined = undefined,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetExpensesByDateController(date, branch_id),
  );
};

export const addExpense = async (
  petty_cash_id: string,
  form_data: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const input = Object.fromEntries(form_data.entries());

  return await runWithUserContext(
    auth.value,
    async () => await AddExpenseController(petty_cash_id, input),
  );
};

export const getBidderReceipts = async (auction_bidder_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetBidderReceiptsController(auction_bidder_id),
  );
};

export const updateRegistrationPayment = async (
  payment_id: string,
  form_data: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const input = Object.fromEntries(form_data.entries());

  return await runWithBranchContext(
    auth.value,
    async () => await UpdateRegistrationPaymentController(payment_id, input),
  );
};

export const getPettyCashBalance = async (
  date: string,
  branch_id: string | undefined,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(
    auth.value,
    async () => await GetPettyCashBalanceController(date, branch_id),
  );
};

export const updateExpense = async (
  expense_id: string,
  form_data: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const data = Object.fromEntries(form_data.entries());

  return await runWithUserContext(
    auth.value,
    async () => await UpdateExpenseController(expense_id, data),
  );
};

export const getStorageFeeTotal = async (
  parent_receipt_number: string,
): Promise<number> => {
  const auth = await authorizeAction();
  if (!auth.ok) return 0;

  return await runWithBranchContext(auth.value, async () => {
    const records = await prisma.receipt_records.findMany({
      where: {
        receipt_number: { startsWith: `${parent_receipt_number}SF` },
        purpose: "STORAGE_FEE",
      },
      include: { payments: true },
    });
    return records.reduce(
      (acc, r) => acc + r.payments.reduce((s, p) => s + p.amount_paid, 0),
      0,
    );
  });
};

export const addStorageFee = async (input: StorageFeePaymentInput) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(auth.value, async () =>
    AddStorageFeeController(input),
  );
};

export const undoPayment = async (receipt_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await UndoPaymentController(receipt_id),
  );
};

export const updatePettyCash = async (
  petty_cash_id: string,
  form_data: FormData,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;
  const input = Object.fromEntries(form_data.entries());

  return await runWithUserContext(
    auth.value,
    async () => await UpdatePettyCashController(petty_cash_id, input),
  );
};

export const deleteExpense = async (expense_id: string) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await DeleteExpenseController(expense_id),
  );
};

export const checkPettyCashConsistency = async (
  branch_id: string,
  startDate: string,
  endDate: string,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithBranchContext(auth.value, async () =>
    CheckPettyCashConsistencyController(branch_id, startDate, endDate),
  );
};

export const repairPettyCashConsistency = async (
  branch_id: string,
  startDate: string,
  endDate: string,
) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () =>
      await RepairPettyCashConsistencyController(branch_id, startDate, endDate),
  );
};

export const undoPettyCashRepair = async (snapshot: PettyCashSnapshot) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(auth.value, async () =>
    UndoPettyCashRepairController(snapshot),
  );
};

export const recalculatePettyCash = async (petty_cash: PettyCash) => {
  const auth = await authorizeAction();
  if (!auth.ok) return auth;

  return await runWithUserContext(
    auth.value,
    async () => await RecalculatePettyCashController(petty_cash),
  );
};
