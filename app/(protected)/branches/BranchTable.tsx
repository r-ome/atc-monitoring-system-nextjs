"use client";

import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./branch-columns";
import { Branch } from "src/entities/models/Branch";
import { UpdateBranchModal } from "./UpdateBranchModal";
import { BranchBadge } from "@/app/components/admin";

export const BranchesTable = ({ branches }: { branches: Branch[] }) => {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const renderMobileCard = (row: Row<Branch>) => {
    const b = row.original;
    return (
      <div className="flex items-center gap-3 px-4 py-3">
        <BranchBadge branch={b.name} />
        <span className="ml-auto text-[11px] text-muted-foreground">
          Created {b.created_at}
        </span>
      </div>
    );
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={branches}
        onRowClick={(branch) => setSelectedBranch(branch)}
        renderMobileCard={renderMobileCard}
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
