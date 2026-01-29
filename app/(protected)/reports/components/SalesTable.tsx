"use client";

import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./sales-columns";
import { formatNumberToCurrency } from "@/app/lib/utils";

export type SalesRowType = {
  auction_id: string;
  auction_date: string;
  total_bidders: number;
  total_items: number;
  total_sales: number;
  total_registration_fee: number;
};

interface SalesTableProps {
  sales: SalesRowType[];
  expenses: number;
}

export const SalesTable = ({ sales, expenses }: SalesTableProps) => {
  const SalesSummary = () => {
    const total = sales.reduce((acc, item) => {
      acc += item.total_sales;
      return acc;
    }, 0);
    return (
      <div className="w-fit">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            <span>Total Sales:</span>
            <span className="text-green-500">
              {formatNumberToCurrency(total)}
            </span>
          </div>

          <div className="flex justify-between">
            <span>Total Expense:</span>
            <span className="text-red-500">
              {formatNumberToCurrency(expenses)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return <DataTable title={<SalesSummary />} columns={columns} data={sales} />;
};
