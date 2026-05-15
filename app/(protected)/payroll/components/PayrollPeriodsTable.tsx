"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/app/components/ui/badge";
import { formatNumberToCurrency } from "@/app/lib/utils";
import type { PayrollPeriod } from "src/entities/models/PayrollPeriod";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  POSTED: "default",
  VOID: "destructive",
};

interface Props {
  periods: PayrollPeriod[];
  isAdmin: boolean;
  onOpen?: (period: PayrollPeriod) => void;
}

export const PayrollPeriodsTable: React.FC<Props> = ({ periods, onOpen }) => {
  const router = useRouter();

  if (periods.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">No payroll periods yet.</p>;
  }

  const openPeriod = (p: PayrollPeriod) =>
    onOpen ? onOpen(p) : router.push(`/payroll/${p.payroll_period_id}`);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-4 font-medium">Period</th>
            <th className="pb-2 pr-4 font-medium">Dates</th>
            <th className="pb-2 pr-4 font-medium text-center">Employees</th>
            <th className="pb-2 pr-4 font-medium text-right">Total Net Pay</th>
            <th className="pb-2 pr-4 font-medium text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {periods.map((p) => (
            <tr
              key={p.payroll_period_id}
              className="border-b last:border-0 hover:bg-muted/40 cursor-pointer"
              onClick={() => openPeriod(p)}
            >
              <td className="py-2 pr-4 font-medium">{p.label}</td>
              <td className="py-2 pr-4 text-muted-foreground">
                {p.period_start} – {p.period_end}
              </td>
              <td className="py-2 pr-4 text-center">{p.entry_count}</td>
              <td className="py-2 pr-4 text-right">
                {formatNumberToCurrency(p.total_net_pay)}
              </td>
              <td className="py-2 pr-4 text-center">
                <Badge variant={STATUS_VARIANT[p.status] ?? "secondary"}>{p.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
