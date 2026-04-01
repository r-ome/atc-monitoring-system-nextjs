"use client";

import { useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Branch } from "src/entities/models/Branch";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { formatDate } from "@/app/lib/utils";
import { getMonth } from "date-fns";
import { Loader2 } from "lucide-react";

interface BoughtItemsFilterProps {
  user: { role: string };
  branches: Branch[];
  selectedBranch?: { branch_id: string; name: string } | null;
  selectedYear: string;
  selectedView: string;
  selectedMonth: string;
}

export const BoughtItemsFilter: React.FC<BoughtItemsFilterProps> = ({
  user,
  branches,
  selectedBranch,
  selectedYear,
  selectedView,
  selectedMonth,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const years = Array.from({ length: 10 }).map((_, index) => 2025 + index);
  const months = Array.from({ length: 12 }).map(
    (_, index) => new Date(Number(selectedYear), index, 1),
  );

  const formattedSelectedMonth = new Date(
    Number(selectedYear),
    Number(selectedMonth),
    1,
  );

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key === "view" && value === "yearly") {
      params.delete("month");
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  }

  const isAdmin = ["SUPER_ADMIN", "OWNER"].includes(user.role);

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {isPending && (
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin self-center" />
      )}

      {/* Branch — only for admins */}
      {isAdmin && (
        <div className="w-30">
          <Select
            disabled={isPending}
            value={selectedBranch?.branch_id}
            onValueChange={(value) => updateParam("branch_id", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {branches.map((item) => (
                  <SelectItem key={item.branch_id} value={item.branch_id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Year */}
      <div className="w-30">
        <Select
          disabled={isPending}
          value={selectedView}
          onValueChange={(value) => updateParam("view", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="View" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="w-30">
        <Select
          disabled={isPending}
          value={selectedYear}
          onValueChange={(value) => updateParam("year", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {years.map((item) => (
                <SelectItem key={item} value={item.toString()}>
                  {item}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Month */}
      {selectedView === "monthly" ? (
        <div className="w-30">
          <Select
            disabled={isPending}
            value={getMonth(formattedSelectedMonth).toString()}
            onValueChange={(value) => updateParam("month", value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {months.map((item, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {formatDate(item, "MMMM")}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </div>
  );
};
