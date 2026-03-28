"use client";

import { useEffect, useState } from "react";
import { CoreRow } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { Payment, REFUND_PURPOSES } from "src/entities/models/Payment";
import { columns } from "./transactions-columns";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { getEnabledPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";
import { StatCard, StatCardGroup } from "@/app/components/admin/stat-card";
import {
  Wallet,
  Banknote,
  Smartphone,
  QrCode,
  Building2,
  CreditCard,
  CircleDollarSign,
} from "lucide-react";
import { LucideIcon } from "lucide-react";

const PAYMENT_METHOD_ICONS: Record<string, LucideIcon> = {
  CASH: Banknote,
  GCASH: Smartphone,
  "GCASH (QR CODE)": QrCode,
  BDO: Building2,
  BPI: CreditCard,
};

const GREEN_CARD = "gap-0 py-0 [&_[data-slot=card-content]]:p-4 [&_p.text-2xl]:text-base [&_p.text-2xl]:text-green-600 dark:[&_p.text-2xl]:text-green-400";
const RED_CARD = "gap-0 py-0 [&_[data-slot=card-content]]:p-4 [&_p.text-2xl]:text-base [&_p.text-2xl]:text-red-600 dark:[&_p.text-2xl]:text-red-400";

interface InwardTransactionsTabProps {
  transactions: Payment[];
}

export const InwardTransactionsTab: React.FC<InwardTransactionsTabProps> = ({
  transactions,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getEnabledPaymentMethods();
      if (res.ok) setPaymentMethods(res.value);
    };

    fetchInitialData();
  }, []);

  const globalFilterFn = (
    row: CoreRow<Payment>,
    _columnId?: string,
    filterValue?: string,
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { amount_paid, payment_method, receipt, bidder } = row.original;
    const { receipt_number } = receipt;
    const { bidder_number } = bidder;

    return [bidder_number, amount_paid, receipt_number, payment_method.name]
      .filter(Boolean)
      .some((field) => field.toString()!.toLowerCase().includes(search));
  };

  const getTotal = (acc: number, item: { amount_paid: number }) => {
    acc += item.amount_paid;
    return acc;
  };

  const totalRefund = transactions
    .filter((item) => REFUND_PURPOSES.includes(item.receipt.purpose))
    .reduce(getTotal, 0);
  const totalInwardCash =
    transactions
      .filter((item) => !REFUND_PURPOSES.includes(item.receipt.purpose))
      .reduce(getTotal, 0) - totalRefund;

  const methodTotals = paymentMethods
    .map((item) => {
      const total = transactions
        .filter((tx) => !REFUND_PURPOSES.includes(tx.receipt.purpose))
        .filter(
          (tx) =>
            tx.payment_method.payment_method_id === item.payment_method_id,
        )
        .reduce(getTotal, 0);

      return { name: item.name, total };
    })
    .map((item) => ({
      ...item,
      total: item.name === "CASH" ? item.total - totalRefund : item.total,
    }))
    .filter((item) => item.total !== 0);

  const nonRefundCount = transactions.filter(
    (tx) => !REFUND_PURPOSES.includes(tx.receipt.purpose),
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Total Inward — prominent full-width banner */}
      <StatCard
        title="Total Inward"
        value={`₱${totalInwardCash.toLocaleString()}`}
        description={`${nonRefundCount} transactions`}
        icon={Wallet}
        variant="success"
        className="gap-0 py-0 [&_[data-slot=card-content]]:p-4 [&_p.text-2xl]:text-xl"
      />

      {/* Payment method breakdown */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">
          Breakdown by payment method
        </p>
        <StatCardGroup columns={Math.max(2, Math.min(methodTotals.length + (totalRefund !== 0 ? 1 : 0), 5)) as 2 | 3 | 4 | 5}>
          {methodTotals.map((item) => (
            <StatCard
              key={item.name}
              title={item.name}
              value={`₱${item.total.toLocaleString()}`}
              icon={PAYMENT_METHOD_ICONS[item.name] ?? CircleDollarSign}
              className={GREEN_CARD}
            />
          ))}
          {totalRefund !== 0 && (
            <StatCard
              title="REFUND"
              value={`₱${totalRefund.toLocaleString()}`}
              variant="error"
              className={RED_CARD}
            />
          )}
        </StatCardGroup>
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search payment here",
          },
        }}
      />
    </div>
  );
};
