"use client";

import { CoreRow, ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { ExpenseTypeBadge } from "@/app/components/admin";
import { DataTable } from "@/app/components/data-table/data-table";
import { Button } from "@/app/components/ui/button";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { ExpenseSummaryEntry, FilterMode } from "src/entities/models/Report";
import { GenerateExpensesSummaryReport } from "./GenerateExpensesSummaryReport";

const columns: ColumnDef<ExpenseSummaryEntry>[] = [
  {
    id: "created_at",
    accessorFn: (row) => new Date(row.created_at_value).getTime(),
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.created_at}</div>
    ),
  },
  {
    accessorKey: "purpose",
    header: () => <div className="text-center">Purpose</div>,
    cell: ({ row }) => (
      <div className="flex justify-center">
        <ExpenseTypeBadge expenseType={row.original.purpose} />
      </div>
    ),
  },
  {
    accessorKey: "remarks",
    header: "Remarks",
    cell: ({ row }) => <div className="min-w-52">{row.original.remarks}</div>,
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <div className="flex justify-center">
        <Button
          variant="ghost"
          className="cursor-pointer"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Amount
          <ArrowUpDown />
        </Button>
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex justify-center font-semibold text-red-500">
        {formatNumberToCurrency(row.original.amount)}
      </div>
    ),
  },
];

interface ExpensesSummaryTableProps {
  branchName: string;
  data: ExpenseSummaryEntry[];
  dateParam: string;
  mode: FilterMode;
}

export const ExpensesSummaryTable = ({
  branchName,
  data,
  dateParam,
  mode,
}: ExpensesSummaryTableProps) => {
  const totalExpenses = data.reduce((sum, item) => sum + item.amount, 0);

  const globalFilterFn = (
    row: CoreRow<ExpenseSummaryEntry>,
    _columnId?: string,
    filterValue?: string,
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { amount, created_at, purpose, remarks } = row.original;

    return [created_at, purpose, remarks, amount]
      .filter(Boolean)
      .some((field) => field.toString().toLowerCase().includes(search));
  };

  return (
    <DataTable
      title={
        <div className="flex gap-6">
          <span>
            Expenses: <span className="font-semibold">{data.length}</span>
          </span>
          <span>
            Total Amount:{" "}
            <span className="text-red-500">
              {formatNumberToCurrency(totalExpenses)}
            </span>
          </span>
        </div>
      }
      actionButtons={
        <GenerateExpensesSummaryReport
          branchName={branchName}
          data={data}
          dateParam={dateParam}
          mode={mode}
        />
      }
      columns={columns}
      data={data}
      searchFilter={{
        globalFilterFn,
        searchComponentProps: {
          placeholder: "Search expenses",
        },
      }}
      initialSorting={[{ id: "created_at", desc: true }]}
    />
  );
};
