"use client";

import { useState } from "react";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./branch-columns";
import { Branch } from "src/entities/models/Branch";
import { UpdateBranchModal } from "./UpdateBranchModal";

export const BranchesTable = ({ branches }: { branches: Branch[] }) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  return (
    <>
      <DataTable
        columns={columns}
        data={branches}
        onRowClick={(branch) => setSelectedBranch(branch)}
      />

      {selectedBranch && (
        <UpdateBranchModal
          branch={selectedBranch}
          open={selectedBranch !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedBranch(null);
          }}
        />
      )}
    </>
  );
};
