import { Badge } from "@/app/components/ui/badge";

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
