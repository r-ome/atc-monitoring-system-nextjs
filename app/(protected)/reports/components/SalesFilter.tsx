"use client";

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
import { FilterMode } from "src/entities/models/Report";

interface SalesFilterProps {
  branches: Branch[];
  selectedBranch?: { branch_id: string; name: string } | null;
  selectedYear: string;
  selectedMonth: string;
  filterMode: FilterMode;
}

export const SalesFilter: React.FC<SalesFilterProps> = ({
  branches,
  selectedBranch,
  selectedYear,
  selectedMonth,
  filterMode,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4 items-end">
      {/* Branch */}
      <div className="w-30">
        <Select
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

      {/* Filter Mode */}
      <div className="w-30">
        <Select
          value={filterMode}
          onValueChange={(value) => updateParam("filter_mode", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Year */}
      <div className="w-30">
        <Select
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

      {/* Month (only visible in daily mode) */}
      {filterMode === "daily" && (
        <div className="w-30">
          <Select
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
      )}
    </div>
  );
};
