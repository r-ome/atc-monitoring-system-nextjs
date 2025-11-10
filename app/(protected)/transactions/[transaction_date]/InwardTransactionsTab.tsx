"use client";

import { CoreRow } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { Payment } from "src/entities/models/Payment";
import { columns } from "./transactions-columns";
import { Card, CardDescription, CardTitle } from "@/app/components/ui/card";

interface InwardTransactionsTabProps {
  transactions: Payment[];
}

type PaymentTypesTotal = {
  INWARD_TOTAL_CASH: number;
  CASH: number;
  BDO: number;
  GCASH: number;
  BPI: number;
  REFUND: number;
};

export const InwardTransactionsTab: React.FC<InwardTransactionsTabProps> = ({
  transactions,
}) => {
  const globalFilterFn = (
    row: CoreRow<Payment>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { amount_paid, payment_type, receipt, bidder } = row.original;
    const { receipt_number } = receipt;
    const { bidder_number } = bidder;

    return [bidder_number, amount_paid, receipt_number, payment_type]
      .filter(Boolean)
      .some((field) => field.toString()!.toLowerCase().includes(search));
  };

  const payment_type_summary = transactions.reduce<PaymentTypesTotal>(
    (acc, item) => {
      acc["INWARD_TOTAL_CASH"] += item.amount_paid;

      if (item.payment_type === "CASH" && item.receipt.purpose !== "REFUNDED")
        acc[item.payment_type] += item.amount_paid;
      if (item.payment_type === "BDO")
        acc[item.payment_type] += item.amount_paid;
      if (item.payment_type === "BPI")
        acc[item.payment_type] += item.amount_paid;
      if (item.payment_type === "GCASH")
        acc[item.payment_type] += item.amount_paid;

      if (item.receipt.purpose === "REFUNDED") {
        acc["REFUND"] += item.amount_paid;
        acc["INWARD_TOTAL_CASH"] -= item.amount_paid;
      }

      return acc;
    },
    { INWARD_TOTAL_CASH: 0, CASH: 0, BDO: 0, GCASH: 0, BPI: 0, REFUND: 0 }
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Object.keys(payment_type_summary).map((item) => (
          <Card key={item} className="flex-1 py-3 px-4">
            <CardTitle className="text-lg">
              ₱
              {payment_type_summary[
                item as keyof PaymentTypesTotal
              ].toLocaleString()}
            </CardTitle>
            <CardDescription className="text-sm -mt-4">
              {item.replace(/_/g, " ")}
            </CardDescription>
          </Card>
        ))}
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
