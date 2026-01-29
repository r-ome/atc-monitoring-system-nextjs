"use client";

import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Branch } from "src/entities/models/Branch";
import { formatDate } from "@/app/lib/utils";
import { Badge } from "@/app/components/ui/badge";

interface TransactionHeaderProps {
  user: { role: string };
  selectedBranch: { branch_id: string; name: string } | null;
  branches: Branch[];
}

export const TransactionHeader: React.FC<TransactionHeaderProps> = ({
  user,
  selectedBranch,
  branches,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { transaction_date }: { transaction_date: string } = useParams();

  return (
    <div className="flex justify-between flex-col md:flex-row gap-2">
      <div className="">
        <h1 className="uppercase text-xl flex items-center gap-2">
          {user && ["SUPER_ADMIN", "OWNER"].includes(user.role) ? (
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
          ) : null}
          {formatDate(new Date(transaction_date), "MMMM dd, yyyy")} Cash Book{" "}
          {selectedBranch ? (
            <Badge
              variant={selectedBranch.name === "TARLAC" ? "success" : "warning"}
            >
              {selectedBranch.name}
            </Badge>
          ) : null}
        </h1>
      </div>
    </div>
  );
};
