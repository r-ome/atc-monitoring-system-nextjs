"use client";

import { useRouter } from "next/navigation";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Calendar } from "lucide-react";
import { DataTable } from "@/app/components/data-table/data-table";
import { Badge } from "@/app/components/ui/badge";
import { formatNumberToCurrency } from "@/app/lib/utils";
import type { PayrollPeriod } from "src/entities/models/PayrollPeriod";

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  POSTED: "default",
  VOID: "destructive",
};

interface Props {
  periods: PayrollPeriod[];
  isAdmin: boolean;
  onOpen?: (period: PayrollPeriod) => void;
  actionButtons?: React.ReactNode;
}

export const PayrollPeriodsTable: React.FC<Props> = ({
  periods,
  onOpen,
  actionButtons,
}) => {
  const router = useRouter();

  const openPeriod = (p: PayrollPeriod) =>
    onOpen ? onOpen(p) : router.push(`/payroll/${p.payroll_period_id}`);

  const columns: ColumnDef<PayrollPeriod>[] = [
    {
      accessorKey: "label",
      header: "Period",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.label}</span>
      ),
    },
    {
      id: "dates",
      header: "Dates",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.period_start} – {row.original.period_end}
        </span>
      ),
    },
    {
      accessorKey: "entry_count",
      header: () => <div className="text-center">Employees</div>,
      cell: ({ row }) => (
        <div className="text-center font-mono">{row.original.entry_count}</div>
      ),
      size: 110,
    },
    {
      accessorKey: "total_net_pay",
      header: () => <div className="text-right">Total Net Pay</div>,
      cell: ({ row }) => (
        <div className="text-right font-mono">
          {formatNumberToCurrency(row.original.total_net_pay)}
        </div>
      ),
      size: 160,
    },
    {
      accessorKey: "status",
      header: () => <div className="text-center">Status</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant={STATUS_VARIANT[row.original.status] ?? "secondary"}>
            {row.original.status}
          </Badge>
        </div>
      ),
      size: 110,
    },
  ];

  const renderMobileCard = (row: Row<PayrollPeriod>) => {
    const p = row.original;
    return (
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14px] font-semibold">{p.label}</span>
            <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>
              {p.status}
            </Badge>
          </div>
          <span className="text-[12.5px] text-muted-foreground">
            {p.period_start} – {p.period_end}
          </span>
          <span className="text-[12px] text-muted-foreground">
            {p.entry_count} employees · {formatNumberToCurrency(p.total_net_pay)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <DataTable
      embedded={false}
      icon={Calendar}
      title="Payroll Periods"
      meta={`${periods.length.toLocaleString()} entries`}
      rowLabel="period"
      columns={columns}
      data={periods}
      onRowClick={openPeriod}
      renderMobileCard={renderMobileCard}
      actionButtons={actionButtons}
      searchFilter={{
        globalFilterFn: "includesString",
        searchComponentProps: { placeholder: "Search by label or date…" },
      }}
      initialSorting={[{ id: "label", desc: true }]}
    />
  );
};
