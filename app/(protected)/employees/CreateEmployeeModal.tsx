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
  DialogTrigger,
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
import { createEmployee } from "./actions";
import {
  EMPLOYEE_TYPE,
  SALARY_TYPE,
  WORKER_TYPE,
  DECLARATION_STATUS,
} from "src/entities/models/Employee";
import type { Branch } from "src/entities/models/Branch";

interface CreateEmployeeModalProps {
  branches: Branch[];
  defaultBranchId: string;
  isAdmin: boolean;
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({
  branches,
  defaultBranchId,
  isAdmin,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>();
  const [branchId, setBranchId] = useState(defaultBranchId);
  const [employeeType, setEmployeeType] = useState<"REGULAR" | "CONTRACTUAL">("REGULAR");
  const [salaryType, setSalaryType] = useState<"FIXED_MONTHLY" | "DAILY_RATE" | "TASK_BASED">("DAILY_RATE");
  const [workerType, setWorkerType] = useState<"REGULAR_WORKER" | "EXTRA_WORKER">("REGULAR_WORKER");
  const [declarationStatus, setDeclarationStatus] = useState<"DECLARED" | "NON_DECLARED">("DECLARED");

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    setErrors(undefined);
    if (!value) {
      setBranchId(defaultBranchId);
      setEmployeeType("REGULAR");
      setSalaryType("DAILY_RATE");
      setWorkerType("REGULAR_WORKER");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("branch_id", branchId);
    formData.set("employee_type", employeeType);
    formData.set("salary_type", salaryType);
    formData.set("worker_type", workerType);
    formData.set("declaration_status", declarationStatus);
    setIsLoading(true);
    try {
      const res = await createEmployee(formData);
      if (res.ok) {
        toast.success("Employee created!");
        setOpen(false);
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
      <DialogTrigger asChild>
        <Button>Add Employee</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
              <TabsTrigger value="gov">Gov&apos;t IDs</TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent forceMount value="basic" className="space-y-3 data-[state=inactive]:hidden">
              <div className="flex gap-4">
                <Label className="w-40 pt-2">First Name</Label>
                <Input name="first_name" required error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Middle Name</Label>
                <Input name="middle_name" error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Last Name</Label>
                <Input name="last_name" required error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Position</Label>
                <Input name="position" error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Birthday</Label>
                <Input type="date" name="birthday" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Date Hired</Label>
                <Input type="date" name="date_hired" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Contact</Label>
                <Input name="contact_number" error={errors} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Address</Label>
                <Textarea name="address" rows={2} />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Emergency Contact</Label>
                <Input name="emergency_contact_name" placeholder="Name" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Emergency No.</Label>
                <Input name="emergency_contact_number" placeholder="Number" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Contract Type</Label>
                <Select value={employeeType} onValueChange={(v: "REGULAR" | "CONTRACTUAL") => setEmployeeType(v)}>
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
                <Textarea name="remarks" />
              </div>
            </TabsContent>

            {/* Payroll Config */}
            <TabsContent forceMount value="payroll" className="space-y-3 data-[state=inactive]:hidden">
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Worker Type</Label>
                <Select value={workerType} onValueChange={(v: "REGULAR_WORKER" | "EXTRA_WORKER") => setWorkerType(v)}>
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
              {salaryType === "DAILY_RATE" || salaryType === "TASK_BASED" ? (
                <div className="flex gap-4">
                  <Label className="w-40 pt-2">Daily Rate (₱)</Label>
                  <Input type="number" step="0.01" min="0" name="default_daily_rate" />
                </div>
              ) : (
                <div className="flex gap-4">
                  <Label className="w-40 pt-2">Basic Pay / Cutoff (₱)</Label>
                  <Input type="number" step="0.01" min="0" name="default_monthly_salary" placeholder="Per semi-monthly cutoff" />
                </div>
              )}
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Auction Rate (₱)</Label>
                <Input type="number" step="0.01" min="0" name="default_auction_rate" placeholder="Per auction day" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Container Rate (₱)</Label>
                <Input type="number" step="0.01" min="0" name="default_container_rate" placeholder="Per container day" />
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
              <p className="text-xs text-muted-foreground">OT rates are auto-computed from daily rate. Set manually below to override.</p>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">OT Rate/Hour (₱)</Label>
                <Input type="number" step="0.0001" min="0" name="default_ot_hour_rate" placeholder="Leave blank to auto-compute" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">OT Rate/Min (₱)</Label>
                <Input type="number" step="0.0001" min="0" name="default_ot_minute_rate" placeholder="Leave blank to auto-compute" />
              </div>
            </TabsContent>

            {/* Government IDs */}
            <TabsContent forceMount value="gov" className="space-y-3 data-[state=inactive]:hidden">
              <div className="flex gap-4">
                <Label className="w-40 pt-2">TIN</Label>
                <Input name="tin" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">SSS No.</Label>
                <Input name="sss_number" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">PhilHealth No.</Label>
                <Input name="philhealth_number" />
              </div>
              <div className="flex gap-4">
                <Label className="w-40 pt-2">Pag-IBIG No.</Label>
                <Input name="pagibig_number" />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
