"use client";

import { useEffect, useState } from "react";
import { CoreRow } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { Payment } from "src/entities/models/Payment";
import { columns } from "./transactions-columns";
import { Card, CardDescription, CardTitle } from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";
import { PaymentMethod } from "src/entities/models/PaymentMethod";
import { getPaymentMethods } from "@/app/(protected)/configurations/payment-methods/actions";

interface InwardTransactionsTabProps {
  transactions: Payment[];
}

export const InwardTransactionsTab: React.FC<InwardTransactionsTabProps> = ({
  transactions,
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getPaymentMethods();
      if (res.ok) setPaymentMethods(res.value);
    };

    fetchInitialData();
  }, []);

  const globalFilterFn = (
    row: CoreRow<Payment>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { amount_paid, payment_method, receipt, bidder } = row.original;
    const { receipt_number } = receipt;
    const { bidder_number } = bidder;

    return [bidder_number, amount_paid, receipt_number, payment_method.name]
      .filter(Boolean)
      .some((field) => field.toString()!.toLowerCase().includes(search));
  };

  const payment_methods = paymentMethods.reduce<Record<string, number>>(
    (acc, item) => ({ ...acc, [item.name]: 0 }),
    { INWARD_TOTAL_CASH: 0, REFUND: 0 }
  );

  const payment_method_summary = transactions.reduce<typeof payment_methods>(
    (acc, item) => {
      acc["INWARD_TOTAL_CASH"] += item.amount_paid;

      acc[item.payment_method?.name] += item.amount_paid;

      if (item.receipt.purpose === "REFUNDED") {
        acc["REFUND"] += item.amount_paid;
        acc["CASH"] += item.amount_paid;
        acc["INWARD_TOTAL_CASH"] -= item.amount_paid;
      }
      return acc;
    },
    payment_methods
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {Object.keys(payment_method_summary)
          .filter((item) => payment_method_summary[item] !== 0)
          .map((item) => (
            <Card key={item} className="flex-1 py-3 px-4">
              <CardTitle
                className={cn(
                  "text-lg text-green-500",
                  item === "REFUND" && "text-red-500"
                )}
              >
                ₱{payment_method_summary[item].toLocaleString()}
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
