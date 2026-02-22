"use client";

import { useRouter } from "next/navigation";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./branch-columns";
import { Branch } from "src/entities/models/Branch";

export const BranchsTable = ({ branches }: { branches: Branch[] }) => {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      data={branches}
      onRowClick={(branch) => router.push(`/branches/${branch.name}`)}
    />
  );
};
