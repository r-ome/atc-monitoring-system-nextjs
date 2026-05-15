"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { formatNumberToCurrency } from "@/app/lib/utils";
import type { PayrollEntry } from "src/entities/models/PayrollEntry";
import { deletePayrollEntry, markEntryPaid } from "../../actions";

interface Props {
  entries: PayrollEntry[];
  isAdmin: boolean;
  isDraft: boolean;
  onEdit: (entry: PayrollEntry) => void;
  periodId: string;
}

export const PayrollEntriesTable: React.FC<Props> = ({
  entries,
  isAdmin,
  isDraft,
  onEdit,
  periodId: _periodId,
}) => {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);

  const handleDelete = async (entry: PayrollEntry) => {
    if (!confirm(`Delete entry for ${entry.name_snapshot}?`)) return;
    setDeleting(entry.payroll_entry_id);
    try {
      const res = await deletePayrollEntry(entry.payroll_entry_id);
      if (res.ok) {
        toast.success("Entry deleted");
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Error");
      }
    } finally {
      setDeleting(null);
    }
  };

  const handlePay = async (entry: PayrollEntry) => {
    if (
      !confirm(
        `Mark ${entry.name_snapshot} as paid? This will create a SALARY expense for ₱${entry.net_pay.toLocaleString()}.`,
      )
    )
      return;
    setPaying(entry.payroll_entry_id);
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await markEntryPaid(entry.payroll_entry_id, today);
      if (res.ok) {
        toast.success("Marked as paid!");
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Error");
      }
    } finally {
      setPaying(null);
    }
  };

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No entries. Click "Generate from Employees" or "Add Entry".
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-2 pr-3 font-medium">Name</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 pr-3 font-medium text-center">Days</th>
            <th className="pb-2 pr-3 font-medium text-right">Basic Pay</th>
            <th className="pb-2 pr-3 font-medium text-right">Gross</th>
            <th className="pb-2 pr-3 font-medium text-right">Deductions</th>
            <th className="pb-2 pr-3 font-medium text-right">Net Pay</th>
            <th className="pb-2 pr-3 font-medium text-center">Status</th>
            <th className="pb-2 font-medium" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.payroll_entry_id}
              className="border-b last:border-0 hover:bg-muted/40"
            >
              <td className="py-2 pr-3 font-medium">{entry.name_snapshot}</td>
              <td className="py-2 pr-3">
                <Badge variant="outline" className="text-xs">
                  {entry.worker_type_snapshot === "EXTRA_WORKER"
                    ? "Extra"
                    : "Regular"}
                </Badge>
              </td>
              <td className="py-2 pr-3 text-center">{entry.days_worked}</td>
              <td className="py-2 pr-3 text-right">
                {formatNumberToCurrency(entry.basic_pay)}
              </td>
              <td className="py-2 pr-3 text-right">
                {formatNumberToCurrency(entry.gross_pay)}
              </td>
              <td className="py-2 pr-3 text-right text-destructive">
                ({formatNumberToCurrency(entry.total_deductions)})
              </td>
              <td className="py-2 pr-3 text-right font-semibold">
                {formatNumberToCurrency(entry.net_pay)}
              </td>
              <td className="py-2 pr-3 text-center">
                {entry.expense_id ? (
                  <Badge variant="default" className="text-xs">
                    Paid
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    Unpaid
                  </Badge>
                )}
              </td>
              <td className="py-2 flex gap-1 justify-end">
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(entry)}
                  >
                    Edit
                  </Button>
                )}
                {isAdmin && !entry.expense_id && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={paying === entry.payroll_entry_id}
                    onClick={() => handlePay(entry)}
                  >
                    Pay
                  </Button>
                )}
                {isAdmin && isDraft && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={deleting === entry.payroll_entry_id}
                    onClick={() => handleDelete(entry)}
                  >
                    Del
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
