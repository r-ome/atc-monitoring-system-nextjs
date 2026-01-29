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

interface SalesFilterProps {
  branches: Branch[];
  selectedBranch?: { branch_id: string; name: string } | null;
  selectedYear: string;
  selectedMonth: string;
}

export const SalesFilter: React.FC<SalesFilterProps> = ({
  branches,
  selectedBranch,
  selectedYear,
  selectedMonth,
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

  return (
    <div className="flex gap-4">
      <div className="w-30">
        <Select
          value={selectedBranch?.branch_id}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("branch_id", value);
            router.push(`?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Branch"></SelectValue>
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
      <div className="w-30">
        <Select
          value={selectedYear}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("year", value);
            router.push(`?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Year"></SelectValue>
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
      <div className="w-30">
        <Select
          value={getMonth(formattedSelectedMonth).toString()}
          onValueChange={(value) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("month", value);
            router.push(`?${params.toString()}`);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Year"></SelectValue>
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
    </div>
  );
};
