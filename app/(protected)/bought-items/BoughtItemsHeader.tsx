import { BranchBadge } from "@/app/components/admin";

interface BoughtItemsHeaderProps {
  selectedBranch: { branch_id: string; name: string } | null;
}

export const BoughtItemsHeader: React.FC<BoughtItemsHeaderProps> = ({
  selectedBranch,
}) => {
  return (
    <div className="flex justify-between flex-col md:flex-row gap-2">
      <div>
        <h1 className="uppercase text-xl flex items-center gap-2">
          {selectedBranch ? (
            <BranchBadge branch={selectedBranch.name} />
          ) : null}
        </h1>
      </div>
    </div>
  );
};
