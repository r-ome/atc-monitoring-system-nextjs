"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Row } from "@tanstack/react-table";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { DataTable } from "@/app/components/data-table/data-table";
import { Users } from "lucide-react";
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
import { ChevronLeftIcon, Loader2Icon } from "lucide-react";
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
  onBack?: () => void;
}

export const PayrollPeriodDetail: React.FC<Props> = ({
  period,
  entries,
  employees,
  isAdmin,
  canWrite = isAdmin,
  branchId,
  onRefreshEntries,
  onBack,
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

  const renderMobileCard = (row: Row<PayrollEntry>) => {
    const e = row.original;
    return (
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[14px] font-semibold">
              {e.name_snapshot}
            </span>
            <Badge
              variant={e.expense_id ? "default" : "secondary"}
              className="text-[10.5px]"
            >
              {e.expense_id ? "Paid" : "Unpaid"}
            </Badge>
          </div>
          <span className="text-[12px] text-muted-foreground">
            {e.days_worked
              ? `${e.days_worked} days · Gross ${formatNumberToCurrency(e.gross_pay)}`
              : `Gross ${formatNumberToCurrency(e.gross_pay)}`}
          </span>
          {e.total_deductions > 0 ? (
            <span className="text-[12px] text-destructive">
              Deductions {formatNumberToCurrency(e.total_deductions)}
            </span>
          ) : null}
        </div>
        <span
          className={
            "shrink-0 font-mono text-[14px] font-semibold " +
            (e.net_pay < 0 ? "text-destructive" : "text-status-success")
          }
        >
          {formatNumberToCurrency(e.net_pay)}
        </span>
      </div>
    );
  };

  const showActions = isDraft && (canWrite || isAdmin);

  return (
    <div className="flex flex-col gap-4 2xl:gap-6">
      <Card className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:gap-6 sm:p-5 2xl:p-6">
        <div className="flex min-w-0 items-center gap-2">
          {onBack ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onBack}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          ) : null}
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <Badge
                variant={
                  period.status === "POSTED"
                    ? "default"
                    : period.status === "VOID"
                      ? "destructive"
                      : "secondary"
                }
              >
                {period.status}
              </Badge>
            </div>
            <h1 className="truncate text-[18px] font-semibold tracking-tight sm:text-[22px] 2xl:text-[28px]">
              {period.label}
            </h1>
            {period.pay_date ? (
              <p className="truncate text-[12.5px] text-muted-foreground 2xl:text-[14.5px]">
                Pay date · {period.pay_date}
              </p>
            ) : null}
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground 2xl:text-[12px]">
                Total Net Pay
              </span>
              <span className="font-mono text-[15px] font-bold text-foreground 2xl:text-[18px]">
                {formatNumberToCurrency(totalNetPay)}
              </span>
            </div>
          </div>
        </div>
        {showActions ? (
          <div className="grid w-full grid-cols-2 gap-2 [&>*]:w-full [&>*]:min-w-0 [&_button]:w-full sm:flex sm:w-auto sm:[&>*]:w-auto sm:[&_button]:w-auto">
            {canWrite && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setUploadOpen(true)}
                >
                  Upload Regular Sheet
                </Button>
                <Button onClick={handleNewEntry}>Add Entry</Button>
              </>
            )}
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="secondary"
                    disabled={isPosting}
                    className="col-span-2 sm:col-span-1"
                  >
                    {isPosting && (
                      <Loader2Icon className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    {isPosting ? "Posting…" : "Post Period"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Post this payroll period?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      All {entries.length}{" "}
                      {entries.length === 1 ? "entry" : "entries"} will be
                      locked and one expense row (purpose = SALARY) will be
                      created per employee. Total payout:{" "}
                      <span className="font-semibold text-foreground">
                        {formatNumberToCurrency(totalNetPay)}
                      </span>
                      . Posting will fail if the branch&apos;s petty cash on
                      the pay date can&apos;t cover this amount.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isPosting}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction asChild>
                      <Button onClick={handlePost} disabled={isPosting}>
                        {isPosting && (
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Post Period
                      </Button>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        ) : null}
      </Card>

      <DataTable
        embedded={false}
        icon={Users}
        title="Payroll Entries"
        meta={`${entries.length.toLocaleString()} entries`}
        rowLabel="entry"
        columns={payrollEntryColumns}
        data={entries}
        onRowClick={isDraft && canWrite ? handleRowClick : undefined}
        renderMobileCard={renderMobileCard}
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
