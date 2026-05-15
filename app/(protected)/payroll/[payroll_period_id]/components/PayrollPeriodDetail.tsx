"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { DataTable } from "@/app/components/data-table/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Loader2Icon } from "lucide-react";
import { formatNumberToCurrency } from "@/app/lib/utils";
import type { PayrollPeriod } from "src/entities/models/PayrollPeriod";
import type { PayrollEntry } from "src/entities/models/PayrollEntry";
import type { Employee } from "src/entities/models/Employee";
import { postPayrollPeriod } from "../../actions";
import { payrollEntryColumns } from "./payroll-entry-columns";
import { PayrollEntrySheet } from "./PayrollEntrySheet";
import { UploadRegularSheetModal } from "./UploadRegularSheetModal";

interface Props {
  period: PayrollPeriod;
  entries: PayrollEntry[];
  employees: Employee[];
  isAdmin: boolean;
  canWrite?: boolean;
  branchId: string;
  onRefreshEntries?: () => Promise<void>;
}

export const PayrollPeriodDetail: React.FC<Props> = ({
  period,
  entries,
  employees,
  isAdmin,
  canWrite = isAdmin,
  branchId,
  onRefreshEntries,
}) => {
  const router = useRouter();
  const [isPosting, setIsPosting] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  const isDraft = period.status === "DRAFT";
  const totalNetPay = entries.reduce((s, e) => s + e.net_pay, 0);

  const handlePost = async () => {
    setIsPosting(true);
    try {
      const res = await postPayrollPeriod(period.payroll_period_id);
      if (res.ok) {
        toast.success("Period posted!");
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Error posting period");
      }
    } finally {
      setIsPosting(false);
    }
  };

  const handleRowClick = (entry: PayrollEntry) => {
    setSelectedEntry(entry);
    setSheetOpen(true);
  };

  const handleNewEntry = () => {
    setSelectedEntry(null);
    setSheetOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header info row */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Dates: </span>
          <span>{period.period_start} – {period.period_end}</span>
        </div>
        {period.pay_date && (
          <div>
            <span className="text-muted-foreground">Pay Date: </span>
            <span>{period.pay_date}</span>
          </div>
        )}
        <div>
          <span className="text-muted-foreground">Status: </span>
          <Badge variant={period.status === "POSTED" ? "default" : period.status === "VOID" ? "destructive" : "secondary"}>
            {period.status}
          </Badge>
        </div>
        <div className="ml-auto font-semibold">
          Total Net Pay: {formatNumberToCurrency(totalNetPay)}
        </div>
      </div>

      {/* Action buttons */}
      {isDraft && (canWrite || isAdmin) && (
        <div className="flex gap-2 flex-wrap">
          {canWrite && (
            <>
              <Button size="sm" variant="outline" onClick={() => setUploadOpen(true)}>
                Upload Regular Sheet
              </Button>
              <Button size="sm" onClick={handleNewEntry}>
                Add Entry
              </Button>
            </>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="secondary" disabled={isPosting}>
                  {isPosting && <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />}
                  {isPosting ? "Posting…" : "Post Period"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Post this payroll period?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All {entries.length} {entries.length === 1 ? "entry" : "entries"} will be
                    locked and one expense row (purpose = SALARY) will be created per employee.
                    Total payout:{" "}
                    <span className="font-semibold text-foreground">
                      {formatNumberToCurrency(totalNetPay)}
                    </span>
                    . Posting will fail if the branch&apos;s petty cash on the pay date can&apos;t
                    cover this amount.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isPosting}>Cancel</AlertDialogCancel>
                  <AlertDialogAction asChild>
                    <Button onClick={handlePost} disabled={isPosting}>
                      {isPosting && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
                      Post Period
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}

      <DataTable
        columns={payrollEntryColumns}
        data={entries}
        onRowClick={isDraft && canWrite ? handleRowClick : undefined}
        searchFilter={{
          globalFilterFn: "includesString",
          searchComponentProps: { placeholder: "Search by name…" },
        }}
      />

      <PayrollEntrySheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSelectedEntry(null);
        }}
        entry={selectedEntry}
        employees={employees}
        periodId={period.payroll_period_id}
        periodStart={period.period_start}
        periodEnd={period.period_end}
        isDraft={isDraft}
        branchId={branchId}
      />

      <UploadRegularSheetModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        payrollPeriodId={period.payroll_period_id}
        onApplied={onRefreshEntries}
      />
    </div>
  );
};
