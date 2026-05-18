"use client";

import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { BranchBadge } from "@/app/components/admin";
import { Branch } from "src/entities/models/Branch";
import { formatDate } from "@/app/lib/utils";

interface TransactionHeaderProps {
  user: { role: string };
  selectedBranch: { branch_id: string; name: string } | null;
  branches: Branch[];
  actions?: React.ReactNode;
}

export const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  user,
  selectedBranch,
  branches,
  actions,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { transaction_date }: { transaction_date: string } = useParams();
  const isAdmin = !!user && ["SUPER_ADMIN", "OWNER"].includes(user.role);

  return (
    <Card className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:gap-6 sm:p-5 2xl:p-6">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
        >
          <Link href="/transactions" aria-label="Back to transactions">
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {selectedBranch ? (
              <BranchBadge branch={selectedBranch.name} />
            ) : null}
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted-foreground 2xl:text-[12px]">
              Cash Book
            </span>
          </div>
          <h1 className="truncate text-[18px] font-semibold tracking-tight sm:text-[22px] 2xl:text-[28px]">
            {formatDate(new Date(transaction_date), "MMMM dd, yyyy")}
          </h1>
        </div>
      </div>

      <div className="grid w-full grid-cols-1 gap-2 [&>*]:w-full [&_button]:w-full sm:flex sm:w-auto sm:items-center sm:[&>*]:w-auto sm:[&_button]:w-auto">
        {isAdmin ? (
          <Select
            value={selectedBranch?.branch_id}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              params.set("branch_id", value);
              router.push(`?${params.toString()}`);
            }}
          >
            <SelectTrigger className="w-full sm:w-[160px]">
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
        ) : null}
        {actions}
      </div>
    </Card>
  );
};
