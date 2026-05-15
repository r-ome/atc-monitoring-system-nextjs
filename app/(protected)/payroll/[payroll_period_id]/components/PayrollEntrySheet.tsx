"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, TrashIcon, Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { Badge } from "@/app/components/ui/badge";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { upsertPayrollEntry, getAuctionDatesForPeriod } from "../../actions";
import type { Employee } from "src/entities/models/Employee";
import type {
  PayrollEntry,
  PayrollEarning,
  PayrollDeduction,
  WorkedDate,
} from "src/entities/models/PayrollEntry";
import {
  PAYROLL_EARNING_TYPE,
  PAYROLL_DEDUCTION_TYPE,
  EARNING_TYPE_LABELS,
  DEDUCTION_TYPE_LABELS,
} from "src/entities/models/PayrollEntry";
import {
  computeBasicPayFromDays,
  computeEntryTotals,
  computeOvertimeRates,
} from "src/application/payroll/compute";
import { WorkedDatesPicker } from "./WorkedDatesPicker";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: PayrollEntry | null;
  employees: Employee[];
  periodId: string;
  periodStart: string;
  periodEnd: string;
  isDraft: boolean;
  branchId: string;
}

type EarningDraft = { _key: string } & Omit<
  PayrollEarning,
  "payroll_earning_id"
> & { payroll_earning_id?: string };
type DeductionDraft = { _key: string } & Omit<
  PayrollDeduction,
  "payroll_deduction_id"
> & { payroll_deduction_id?: string };

let _key = 0;
const nextKey = () => String(++_key);

function initEarnings(entry: PayrollEntry | null): EarningDraft[] {
  if (!entry) return [];
  return entry.earnings.map((e) => ({ ...e, _key: nextKey() }));
}
function initDeductions(entry: PayrollEntry | null): DeductionDraft[] {
  if (!entry) return [];
  return entry.deductions.map((d) => ({ ...d, _key: nextKey() }));
}

export const PayrollEntrySheet: React.FC<Props> = ({
  open,
  onOpenChange,
  entry,
  employees,
  periodId,
  periodStart,
  periodEnd,
  isDraft,
}) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [employeeId, setEmployeeId] = useState(entry?.employee_id ?? "");
  const [workedDates, setWorkedDates] = useState<WorkedDate[]>(entry?.worked_dates ?? []);
  const [auctionDates, setAuctionDates] = useState<string[]>([]);
  const [otHours, setOtHours] = useState(String(entry?.ot_hours ?? 0));
  const [otMinutes, setOtMinutes] = useState(String(entry?.ot_minutes ?? 0));
  const [otManual, setOtManual] = useState(entry?.ot_rate_is_manual ?? false);
  const [otHourRate, setOtHourRate] = useState(
    String(entry?.ot_hour_rate_snapshot ?? ""),
  );
  const [otMinuteRate, setOtMinuteRate] = useState(
    String(entry?.ot_minute_rate_snapshot ?? ""),
  );
  const [earnings, setEarnings] = useState<EarningDraft[]>(initEarnings(entry));
  const [deductions, setDeductions] = useState<DeductionDraft[]>(
    initDeductions(entry),
  );
  const [remarks, setRemarks] = useState(entry?.remarks ?? "");

  const selectedEmployee = employees.find((e) => e.employee_id === employeeId);

  // Auto-compute OT rates when employee changes and not manual
  useEffect(() => {
    if (!otManual && selectedEmployee?.default_daily_rate) {
      const rates = computeOvertimeRates(selectedEmployee.default_daily_rate);
      setOtHourRate(String(rates.ot_hour_rate));
      setOtMinuteRate(String(rates.ot_minute_rate));
    }
  }, [employeeId, otManual, selectedEmployee]);

  // Also auto-compute if employee has explicit OT rates
  useEffect(() => {
    if (!otManual && selectedEmployee) {
      if (selectedEmployee.default_ot_hour_rate)
        setOtHourRate(String(selectedEmployee.default_ot_hour_rate));
      if (selectedEmployee.default_ot_minute_rate)
        setOtMinuteRate(String(selectedEmployee.default_ot_minute_rate));
    }
  }, [employeeId, otManual, selectedEmployee]);

  // Reset when opening with a different entry
  useEffect(() => {
    if (open) {
      setEmployeeId(entry?.employee_id ?? "");
      setWorkedDates(entry?.worked_dates ?? []);
      setOtHours(String(entry?.ot_hours ?? 0));
      setOtMinutes(String(entry?.ot_minutes ?? 0));
      setOtManual(entry?.ot_rate_is_manual ?? false);
      setOtHourRate(String(entry?.ot_hour_rate_snapshot ?? ""));
      setOtMinuteRate(String(entry?.ot_minute_rate_snapshot ?? ""));
      setEarnings(initEarnings(entry));
      setDeductions(initDeductions(entry));
      setRemarks(entry?.remarks ?? "");
    }
  }, [open, entry]);

  // Load auction dates for this period when sheet opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const res = await getAuctionDatesForPeriod(periodId);
      if (!cancelled && res.ok) setAuctionDates(res.value.auction_dates);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, periodId]);

  // Live preview
  const breakdown = selectedEmployee
    ? computeBasicPayFromDays({
        salary_type: selectedEmployee.salary_type,
        daily_rate: selectedEmployee.default_daily_rate ?? null,
        monthly_salary: selectedEmployee.default_monthly_salary ?? null,
        auction_rate: selectedEmployee.default_auction_rate ?? null,
        worked_dates: workedDates,
      })
    : null;
  const basicPay = breakdown?.basic_pay ?? entry?.basic_pay ?? 0;
  const autoAuction = breakdown?.auction_earning ?? 0;

  const otHourPay = (Number(otHours) || 0) * (Number(otHourRate) || 0);
  const otMinutePay = (Number(otMinutes) || 0) * (Number(otMinuteRate) || 0);

  const allEarningsForPreview = [
    { amount: basicPay },
    ...(otHourPay > 0 ? [{ amount: otHourPay }] : []),
    ...(otMinutePay > 0 ? [{ amount: otMinutePay }] : []),
    ...(autoAuction > 0 ? [{ amount: autoAuction }] : []),
    ...earnings.filter(
      (e) =>
        !["BASIC_PAY", "OVERTIME_HOUR", "OVERTIME_MINUTE"].includes(e.type) &&
        // When the engine auto-emits AUCTION (FIXED_MONTHLY × auction days), suppress manual rows
        !(autoAuction > 0 && e.type === "AUCTION"),
    ),
  ];

  const { gross_pay, total_deductions, net_pay } = computeEntryTotals(
    allEarningsForPreview,
    deductions,
  );

  const addEarning = () =>
    setEarnings((prev) => [
      ...prev,
      { _key: nextKey(), type: "AUCTION", amount: 0 },
    ]);
  const removeEarning = (key: string) =>
    setEarnings((prev) => prev.filter((e) => e._key !== key));
  const updateEarning = useCallback(
    (key: string, field: keyof EarningDraft, value: unknown) => {
      setEarnings((prev) =>
        prev.map((e) => (e._key === key ? { ...e, [field]: value } : e)),
      );
    },
    [],
  );

  const addDeduction = () =>
    setDeductions((prev) => [
      ...prev,
      { _key: nextKey(), type: "SSS", amount: 0 },
    ]);
  const removeDeduction = (key: string) =>
    setDeductions((prev) => prev.filter((d) => d._key !== key));
  const updateDeduction = useCallback(
    (key: string, field: keyof DeductionDraft, value: unknown) => {
      setDeductions((prev) =>
        prev.map((d) => (d._key === key ? { ...d, [field]: value } : d)),
      );
    },
    [],
  );

  const handleSave = async () => {
    if (!employeeId) {
      toast.error("Select an employee");
      return;
    }
    setSaving(true);
    try {
      // Exclude managed earning types — repo recomputes them
      const extraEarnings = earnings.filter(
        (e) =>
          !["BASIC_PAY", "OVERTIME_HOUR", "OVERTIME_MINUTE"].includes(e.type),
      );

      const regularCount = workedDates.filter((d) => d.type === "REGULAR").length;
      const auctionCount = workedDates.filter((d) => d.type === "AUCTION").length;
      const leaveCount = workedDates.filter((d) => d.type === "LEAVE").length;

      const payload = {
        payroll_period_id: periodId,
        employee_id: employeeId,
        days_worked: regularCount + auctionCount,
        days_leave_paid: leaveCount,
        ot_hours: Number(otHours) || 0,
        ot_minutes: Number(otMinutes) || 0,
        ot_rate_is_manual: otManual,
        ot_hour_rate_snapshot: otManual ? Number(otHourRate) || null : null,
        ot_minute_rate_snapshot: otManual ? Number(otMinuteRate) || null : null,
        worked_dates: workedDates,
        remarks: remarks || null,
        earnings: extraEarnings.map((e) => ({
          type: e.type,
          amount: Number(e.amount) || 0,
          quantity: e.quantity ?? null,
          rate: e.rate ?? null,
          remarks: e.remarks ?? null,
        })),
        deductions: deductions.map((d) => ({
          type: d.type,
          amount: Number(d.amount) || 0,
          remarks: d.remarks ?? null,
        })),
      };

      const res = await upsertPayrollEntry(payload);
      if (res.ok) {
        toast.success("Entry saved!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Error saving entry");
      }
    } finally {
      setSaving(false);
    }
  };

  const readOnly = !isDraft;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {entry ? `Edit: ${entry.name_snapshot}` : "Add Entry"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 grid grid-cols-2 gap-6">
          {/* ── Left column: Employee + Days/OT ── */}
          <div className="space-y-5">
            {/* Employee */}
            <section>
              <Label className="mb-1 block text-sm font-medium">Employee</Label>
              {entry ? (
                <p className="text-sm font-semibold">{entry.name_snapshot}</p>
              ) : (
                <Select
                  value={employeeId}
                  onValueChange={setEmployeeId}
                  disabled={readOnly}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {employees.map((e) => (
                        <SelectItem key={e.employee_id} value={e.employee_id}>
                          {e.full_name}
                          <span className="ml-2 text-xs text-muted-foreground">
                            (
                            {e.worker_type === "EXTRA_WORKER"
                              ? "Extra"
                              : "Regular"}
                            )
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
              {selectedEmployee && (
                <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                  <span>{selectedEmployee.salary_type.replace("_", " ")}</span>
                  {selectedEmployee.default_daily_rate != null && (
                    <span>
                      Rate: ₱{selectedEmployee.default_daily_rate}/day
                    </span>
                  )}
                  {selectedEmployee.default_monthly_salary != null && (
                    <span>
                      Salary: ₱
                      {selectedEmployee.default_monthly_salary.toLocaleString()}
                    </span>
                  )}
                </div>
              )}
            </section>

            {/* Days & Overtime */}
            <section>
              <h3 className="text-sm font-medium mb-2">Days Worked</h3>
              <WorkedDatesPicker
                periodStart={periodStart}
                periodEnd={periodEnd}
                auctionDates={auctionDates}
                value={workedDates}
                onChange={setWorkedDates}
                disabled={readOnly}
              />
              <h3 className="text-sm font-medium mt-4 mb-2">Overtime</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs mb-1 block">OT Hours</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={otHours}
                    onChange={(e) => setOtHours(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1 block">OT Minutes</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={otMinutes}
                    onChange={(e) => setOtMinutes(e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>

              {/* OT Rates */}
              <div className="mt-3 rounded-md border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">OT Rates</span>
                  <Badge
                    variant={otManual ? "default" : "secondary"}
                    className="cursor-pointer text-xs"
                    onClick={() => !readOnly && setOtManual((v) => !v)}
                  >
                    {otManual ? "Manual" : "Auto"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs mb-1 block">Per Hour (₱)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={otHourRate}
                      onChange={(e) => setOtHourRate(e.target.value)}
                      disabled={!otManual || readOnly}
                    />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Per Minute (₱)</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={otMinuteRate}
                      onChange={(e) => setOtMinuteRate(e.target.value)}
                      disabled={!otManual || readOnly}
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ── Right column: Earnings, Deductions, Remarks, Totals ── */}
          <div className="space-y-5">
            {/* Extra Earnings */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Extra Earnings</h3>
                {!readOnly && (
                  <Button size="sm" variant="outline" onClick={addEarning}>
                    <PlusIcon className="h-3 w-3 mr-1" /> Add
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Basic Pay, OT are auto-computed. Add Auction, Container, Leave,
                Holiday, etc. here.
              </p>
              {earnings
                .filter(
                  (e) =>
                    !["BASIC_PAY", "OVERTIME_HOUR", "OVERTIME_MINUTE"].includes(
                      e.type,
                    ),
                )
                .map((earning) => (
                  <div
                    key={earning._key}
                    className="flex gap-2 mb-2 items-center"
                  >
                    <Select
                      value={earning.type}
                      onValueChange={(v) =>
                        updateEarning(
                          earning._key,
                          "type",
                          v as PayrollEarning["type"],
                        )
                      }
                      disabled={readOnly}
                    >
                      <SelectTrigger className="w-40 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {PAYROLL_EARNING_TYPE.filter(
                            (t) =>
                              ![
                                "BASIC_PAY",
                                "OVERTIME_HOUR",
                                "OVERTIME_MINUTE",
                              ].includes(t),
                          ).map((t) => (
                            <SelectItem key={t} value={t}>
                              {EARNING_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-28 text-xs"
                      placeholder="Amount"
                      value={earning.amount}
                      onChange={(e) =>
                        updateEarning(
                          earning._key,
                          "amount",
                          Number(e.target.value),
                        )
                      }
                      disabled={readOnly}
                    />
                    {!readOnly && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeEarning(earning._key)}
                      >
                        <TrashIcon className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
            </section>

            {/* Deductions */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Deductions</h3>
                {!readOnly && (
                  <Button size="sm" variant="outline" onClick={addDeduction}>
                    <PlusIcon className="h-3 w-3 mr-1" /> Add
                  </Button>
                )}
              </div>
              {deductions.map((ded) => (
                <div key={ded._key} className="flex gap-2 mb-2 items-center">
                  <Select
                    value={ded.type}
                    onValueChange={(v) =>
                      updateDeduction(
                        ded._key,
                        "type",
                        v as PayrollDeduction["type"],
                      )
                    }
                    disabled={readOnly}
                  >
                    <SelectTrigger className="w-40 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {PAYROLL_DEDUCTION_TYPE.map((t) => (
                          <SelectItem key={t} value={t}>
                            {DEDUCTION_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-28 text-xs"
                    placeholder="Amount"
                    value={ded.amount}
                    onChange={(e) =>
                      updateDeduction(
                        ded._key,
                        "amount",
                        Number(e.target.value),
                      )
                    }
                    disabled={readOnly}
                  />
                  {!readOnly && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeDeduction(ded._key)}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </section>

            {/* Remarks */}
            <section>
              <Label className="text-xs mb-1 block">Remarks</Label>
              <Textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={readOnly}
              />
            </section>

            {/* Live totals */}
            <section className="rounded-md border p-3 space-y-1 text-sm bg-muted/30">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Basic Pay</span>
                <span>{formatNumberToCurrency(basicPay)}</span>
              </div>
              {otHourPay > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    OT Hours ({otHours}h × ₱{Number(otHourRate).toFixed(2)})
                  </span>
                  <span>{formatNumberToCurrency(otHourPay)}</span>
                </div>
              )}
              {otMinutePay > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">
                    OT Minutes ({otMinutes}min × ₱
                    {Number(otMinuteRate).toFixed(4)})
                  </span>
                  <span>{formatNumberToCurrency(otMinutePay)}</span>
                </div>
              )}
              {autoAuction > 0 && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Auction (auto)</span>
                  <span>{formatNumberToCurrency(autoAuction)}</span>
                </div>
              )}
              {earnings
                .filter(
                  (e) =>
                    !["BASIC_PAY", "OVERTIME_HOUR", "OVERTIME_MINUTE"].includes(
                      e.type,
                    ) &&
                    !(autoAuction > 0 && e.type === "AUCTION"),
                )
                .map((e) => (
                  <div key={e._key} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {EARNING_TYPE_LABELS[e.type]}
                    </span>
                    <span>{formatNumberToCurrency(Number(e.amount) || 0)}</span>
                  </div>
                ))}
              <div className="flex justify-between border-t pt-1 font-medium">
                <span>Gross Pay</span>
                <span>{formatNumberToCurrency(gross_pay)}</span>
              </div>
              {deductions.map((d) => (
                <div
                  key={d._key}
                  className="flex justify-between text-xs text-destructive"
                >
                  <span>({DEDUCTION_TYPE_LABELS[d.type]})</span>
                  <span>({formatNumberToCurrency(Number(d.amount) || 0)})</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-1 font-semibold text-base">
                <span>Net Pay</span>
                <span>{formatNumberToCurrency(net_pay)}</span>
              </div>
            </section>

            {!readOnly && (
              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving && (
                  <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Entry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
