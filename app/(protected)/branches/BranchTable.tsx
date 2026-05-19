"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";
import { Row } from "@tanstack/react-table";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
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
        <span className="ml-auto text-[13px] text-muted-foreground">
          Created {b.created_at}
        </span>
      </div>
    );
  };

  return (
    <>
      <AuctionDataTable
        icon={Building2}
        title="All Branches"
        meta={`${branches.length.toLocaleString()} total`}
        rowLabel="branch"
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
