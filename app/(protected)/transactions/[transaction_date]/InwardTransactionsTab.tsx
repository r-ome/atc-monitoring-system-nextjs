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
    .filter((item) => item.receipt.purpose === "REFUNDED")
    .reduce(getTotal, 0);
  const totalInwardCash =
    transactions
      .filter((item) => item.receipt.purpose !== "REFUNDED")
      .reduce(getTotal, 0) - totalRefund;

  const something = paymentMethods
    .map((item) => {
      const aaa = () => {
        return transactions
          .filter((item) => item.receipt.purpose !== "REFUNDED")
          .filter(
            (tx) =>
              tx.payment_method.payment_method_id === item.payment_method_id,
          )
          .reduce(getTotal, 0);
      };

      return { [item.name]: aaa() };
    })
    .reduce<Record<string, number>>((acc, obj) => {
      const [key, value] = Object.entries(obj)[0];
      acc[key] = (acc[key] ?? 0) + value;
      if (key === "CASH") {
        acc[key] = acc[key] - totalRefund;
      }
      return acc;
    }, {});

  const something1: Record<string, number> = {
    INWARD_TOTAL_CASH: totalInwardCash,
    REFUND: totalRefund,
    ...something,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-2">
        {Object.keys({
          ...something1,
          INWARD_TOTAL_CASH: totalInwardCash,
          REFUND: totalRefund,
        })
          .filter((item) => something1[item] !== 0)
          .map((item) => (
            <Card key={item} className="flex-1 py-3 px-4">
              <CardTitle
                className={cn(
                  "text-lg text-green-500",
                  item === "REFUND" && "text-red-500",
                )}
              >
                ₱{something1[item].toLocaleString()}
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
