"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import { toast } from "sonner";
import { updateEmployee, deleteEmployee } from "./actions";
import {
  EMPLOYEE_TYPE,
  EMPLOYEE_STATUS,
  SALARY_TYPE,
  WORKER_TYPE,
  DECLARATION_STATUS,
  Employee,
} from "src/entities/models/Employee";
import { EmploymentEventsPanel } from "./EmploymentEventsPanel";
import type { Branch } from "src/entities/models/Branch";

interface UpdateEmployeeModalProps {
  employee: Employee;
  branches: Branch[];
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateEmployeeModal: React.FC<UpdateEmployeeModalProps> = ({
  employee,
  branches,
  isAdmin,
  open,
  onOpenChange,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [employeeType, setEmployeeType] = useState(employee.employee_type);
  const [status, setStatus] = useState(employee.status);
  const [branchId, setBranchId] = useState(employee.branch.branch_id);
  const [salaryType, setSalaryType] = useState(employee.salary_type);
  const [workerType, setWorkerType] = useState(employee.worker_type);
  const [declarationStatus, setDeclarationStatus] = useState(employee.declaration_status ?? "DECLARED");
  const [dailyRate, setDailyRate] = useState(String(employee.default_daily_rate ?? ""));
  const [otHourRate, setOtHourRate] = useState(String(employee.default_ot_hour_rate ?? ""));
  const [otMinuteRate, setOtMinuteRate] = useState(String(employee.default_ot_minute_rate ?? ""));

  // Live audit: derive expected OT rates from daily rate (PH labor code:
  // OT/hr = daily/8 * 1.25, OT/min = OT/hr / 60). Flag drift between
  // what's stored and what the formula would produce.
  const expected = (() => {
    const d = Number(dailyRate);
    if (!Number.isFinite(d) || d <= 0) return null;
    const hr = Math.round((d / 8) * 1.25 * 10000) / 10000;
    const mn = Math.round((hr / 60) * 100) / 100;
    return { hr, mn };
  })();
  const otHourDiff = (() => {
    const cur = Number(otHourRate);
    if (!expected || !Number.isFinite(cur) || cur === 0) return null;
    const delta = cur - expected.hr;
    return Math.abs(delta) > 0.005 ? { current: cur, expected: expected.hr, delta } : null;
  })();
  const otMinDiff = (() => {
    const cur = Number(otMinuteRate);
    if (!expected || !Number.isFinite(cur) || cur === 0) return null;
    const delta = cur - expected.mn;
    return Math.abs(delta) > 0.005 ? { current: cur, expected: expected.mn, delta } : null;
  })();

  const handleOpenChange = (value: boolean) => {
    onOpenChange(value);
    setErrors(undefined);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${employee.full_name}? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await deleteEmployee(employee.employee_id);
      if (res.ok) {
        toast.success("Employee deleted");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(res.error?.message ?? "Error deleting employee");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("branch_id", branchId);
    formData.set("employee_type", employeeType);
    formData.set("status", status);
    formData.set("salary_type", salaryType);
    formData.set("worker_type", workerType);
    formData.set("declaration_status", declarationStatus);
    setIsLoading(true);
    try {
      const res = await updateEmployee(employee.employee_id, formData);
      if (res.ok) {
        toast.success("Employee updated!");
        onOpenChange(false);
        router.refresh();
      } else {
        if (res.error?.message === "Invalid Data!") {
          setErrors(res.error.cause as Record<string, string[]>);
        } else {
          toast.error(res.error.message);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Update Employee — {employee.full_name}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="basic">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="payroll">Payroll</TabsTrigger>
            <TabsTrigger value="gov">Gov&apos;t IDs</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit}>
            {/* Basic Info */}
            <TabsContent forceMount value="basic" className="space-y-3 mt-3 data-[state=inactive]:hidden">
              <div className="flex gap-4">
                <Label className="w-40 pt-2">First Name</Label>
                <Input name="first_name" defaultValue={employee.first_name} required error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Middle Name</Label>
                <Input name="middle_name" defaultValue={employee.middle_name ?? ""} error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Last Name</Label>
                <Input name="last_name" defaultValue={employee.last_name} required error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Position</Label>
                <Input name="position" defaultValue={employee.position ?? ""} error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Birthday</Label>
                <Input type="date" name="birthday" defaultValue={employee.birthday ?? ""} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Date Hired</Label>
                <Input type="date" name="date_hired" defaultValue={employee.date_hired ?? ""} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Contact</Label>
                <Input name="contact_number" defaultValue={employee.contact_number ?? ""} error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Address</Label>
                <Textarea name="address" defaultValue={employee.address ?? ""} rows={2} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Emergency</Label>
                <Input name="emergency_contact_name" defaultValue={employee.emergency_contact_name ?? ""} placeholder="Name" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Emergency No.</Label>
                <Input name="emergency_contact_number" defaultValue={employee.emergency_contact_number ?? ""} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Contract Type</Label>
                <Select value={employeeType} onValueChange={(v: typeof employeeType) => setEmployeeType(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {EMPLOYEE_TYPE.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Status</Label>
                <Select value={status} onValueChange={(v: typeof status) => setStatus(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {EMPLOYEE_STATUS.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {isAdmin && (
                <div className="flex gap-4">
                  <Label className="w-40 pt-2">Branch</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {branches.map((b) => (
                          <SelectItem key={b.branch_id} value={b.branch_id}>{b.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Remarks</Label>
                <Textarea name="remarks" defaultValue={employee.remarks ?? ""} />
              </div>
            </TabsContent>

            {/* Payroll Config */}
            <TabsContent forceMount value="payroll" className="space-y-3 mt-3 data-[state=inactive]:hidden">
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Worker Type</Label>
                <Select value={workerType} onValueChange={(v: typeof workerType) => setWorkerType(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {WORKER_TYPE.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Salary Type</Label>
                <Select value={salaryType} onValueChange={(v: typeof salaryType) => setSalaryType(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {SALARY_TYPE.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Daily Rate (₱)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  name="default_daily_rate"
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Basic Pay / Cutoff (₱)</Label>
                <Input type="number" step="0.01" min="0" name="default_monthly_salary" defaultValue={employee.default_monthly_salary ?? ""} placeholder="Per semi-monthly cutoff" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Auction Rate (₱)</Label>
                <Input type="number" step="0.01" min="0" name="default_auction_rate" defaultValue={employee.default_auction_rate ?? ""} placeholder="Per auction day" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Container Rate (₱)</Label>
                <Input type="number" step="0.01" min="0" name="default_container_rate" defaultValue={employee.default_container_rate ?? ""} placeholder="Per container day" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Declaration</Label>
                <Select value={declarationStatus} onValueChange={(v: typeof declarationStatus) => setDeclarationStatus(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {DECLARATION_STATUS.map((t) => (
                        <SelectItem key={t} value={t}>{t === "DECLARED" ? "Declared (SSS/PH/PI deducted)" : "Non-declared (SSS/PH/PI added to net)"}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Leave OT rates blank to auto-compute from daily rate.</p>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">OT Rate/Hour (₱)</Label>
                <div className="flex-1 space-y-1">
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    name="default_ot_hour_rate"
                    value={otHourRate}
                    onChange={(e) => setOtHourRate(e.target.value)}
                  />
                  {otHourDiff && (
                    <p className="text-[11px] text-amber-600">
                      ⚠ Stored {otHourDiff.current} differs from expected{" "}
                      {otHourDiff.expected} (daily/8 × 1.25). Δ ={" "}
                      {otHourDiff.delta > 0 ? "+" : ""}
                      {otHourDiff.delta.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">OT Rate/Min (₱)</Label>
                <div className="flex-1 space-y-1">
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    name="default_ot_minute_rate"
                    value={otMinuteRate}
                    onChange={(e) => setOtMinuteRate(e.target.value)}
                  />
                  {otMinDiff && (
                    <p className="text-[11px] text-amber-600">
                      ⚠ Stored {otMinDiff.current} differs from expected{" "}
                      {otMinDiff.expected} (OT/hr ÷ 60). Δ ={" "}
                      {otMinDiff.delta > 0 ? "+" : ""}
                      {otMinDiff.delta.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Government IDs */}
            <TabsContent forceMount value="gov" className="space-y-3 mt-3 data-[state=inactive]:hidden">
              <div className="flex gap-4">
                <Label className="w-40 pt-2">TIN</Label>
                <Input name="tin" defaultValue={employee.tin ?? ""} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">SSS No.</Label>
                <Input name="sss_number" defaultValue={employee.sss_number ?? ""} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">PhilHealth No.</Label>
                <Input name="philhealth_number" defaultValue={employee.philhealth_number ?? ""} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Pag-IBIG No.</Label>
                <Input name="pagibig_number" defaultValue={employee.pagibig_number ?? ""} />
              </div>
            </TabsContent>

            <DialogFooter className="mt-4">
              {isAdmin && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeleting || isLoading}
                  onClick={handleDelete}
                  className="mr-auto"
                >
                  {isDeleting && <Loader2Icon className="animate-spin" />}
                  Delete
                </Button>
              )}
              <DialogClose asChild>
                <Button type="button" variant="secondary" disabled={isLoading || isDeleting}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || isDeleting}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>

          {/* Employment Events — outside the form */}
          <TabsContent value="events" className="mt-3">
            <EmploymentEventsPanel employeeId={employee.employee_id} isAdmin={isAdmin} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
