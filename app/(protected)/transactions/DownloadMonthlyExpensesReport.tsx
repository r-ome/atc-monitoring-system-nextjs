"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Branch } from "src/entities/models/Branch";
import { Button } from "@/app/components/ui/button";
import { formatDate } from "@/app/lib/utils";
import { generateReport } from "@/app/lib/reports";
import { getMonthlyExpensesSummary } from "./actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";

interface DownloadMonthlyExpensesReportProps {
  month: Date;
  branchId: string;
  branchName: string;
  branches?: Branch[];
}

export const DownloadMonthlyExpensesReport = ({
  month,
  branchId,
  branchName,
  branches,
}: DownloadMonthlyExpensesReportProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [open, setOpen] = useState(false);
  const canChooseBranch = branches && branches.length > 0;

  const downloadReport = async (branch: { branch_id: string; name: string }) => {
    setIsDownloading(true);
    try {
      const res = await getMonthlyExpensesSummary({
        year: month.getFullYear(),
        monthIndex: month.getMonth(),
        branch_id: branch.branch_id,
      });

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error.cause : null;
        toast.error(res.error.message, { description });
        return;
      }

      if (res.value.length === 0) {
        toast.info("No monthly expenses found.", {
          description: `${branch.name} · ${formatDate(month, "MMMM yyyy")}`,
        });
        return;
      }

      generateReport(
        { expensesSummary: res.value },
        ["expenses_summary"],
        `Monthly Expenses ${branch.name} ${formatDate(month, "MMMM yyyy")}`,
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const buttonContent = (
    <>
      {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
      Monthly Expenses
    </>
  );

  if (!canChooseBranch) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={isDownloading}
        onClick={() => downloadReport({ branch_id: branchId, name: branchName })}
      >
        {buttonContent}
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" disabled={isDownloading}>
          {buttonContent}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Search branch..." />
          <CommandList>
            <CommandEmpty>No branch found.</CommandEmpty>
            <CommandGroup>
              {branches.map((branch) => (
                <CommandItem
                  key={branch.branch_id}
                  value={branch.name}
                  onSelect={() => {
                    setOpen(false);
                    void downloadReport(branch);
                  }}
                  className="cursor-pointer"
                >
                  {branch.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
