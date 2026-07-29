export type PaymentEntryForAllocation = {
  payment_method: string;
  amount_paid: number;
};

export type AllocatedPaymentEntry = {
  payment_method: string;
  pullOutAmount: number;
  storageAmount: number;
};

export type StorageFeeRow = {
  payment_method: string;
  amount_paid: number;
};

export type StorageFeeAllocation = {
  entries: AllocatedPaymentEntry[];
  storageRows: StorageFeeRow[];
};

/**
 * Splits a pull-out submission into its pull-out and storage-fee portions.
 *
 * A storage fee is entered as a charge, not as a tender — the cashier types an
 * amount into the payment breakdown and never says which payment method covered
 * it. Pro-rating it across the entries invents an answer to that question, which
 * is how a ₱400 fee ended up recorded as ₱348 BDO + ₱52 GCASH.
 *
 * Instead the tenders are applied in entry order to the item total first, so the
 * storage fee is absorbed by the last entries. Operator-entered tender
 * boundaries survive intact — every submitted entry keeps its own pull-out row,
 * even when two entries share a method — while the storage rows are grouped by
 * method, since those carry no operator intent to preserve.
 *
 * The fee only spans more than one method when the trailing entries are smaller
 * than the fee itself, in which case the arithmetic leaves no single method to
 * attribute it to.
 */
export function allocateStorageFee(
  payments: PaymentEntryForAllocation[],
  storageFee: number,
): StorageFeeAllocation {
  const storageAmounts = payments.map(() => 0);

  let unallocated = Math.max(storageFee, 0);
  for (let index = payments.length - 1; index >= 0 && unallocated > 0; index--) {
    const absorbed = Math.min(unallocated, payments[index].amount_paid);
    storageAmounts[index] = absorbed;
    unallocated -= absorbed;
  }

  const entries = payments.map((payment, index) => ({
    payment_method: payment.payment_method,
    pullOutAmount: payment.amount_paid - storageAmounts[index],
    storageAmount: storageAmounts[index],
  }));

  const totalsByMethod = new Map<string, number>();
  for (const entry of entries) {
    if (entry.storageAmount === 0) continue;
    totalsByMethod.set(
      entry.payment_method,
      (totalsByMethod.get(entry.payment_method) ?? 0) + entry.storageAmount,
    );
  }

  return {
    entries,
    storageRows: [...totalsByMethod].map(([payment_method, amount_paid]) => ({
      payment_method,
      amount_paid,
    })),
  };
}
