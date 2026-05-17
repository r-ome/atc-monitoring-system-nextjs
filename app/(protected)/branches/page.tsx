import { Building2 } from "lucide-react";
import { getBranches } from "@/app/(protected)/branches/actions";
import { Card } from "@/app/components/ui/card";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { BranchesTable } from "./BranchTable";
import { CreateBranchModal } from "./CreateBranchModal";

export default async function Page() {
  const res = await getBranches();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const branches = res.value;
  return (
    <PageContainer>
      <PageHeader
        title="Branches"
        subtitle="Manage branch locations"
        actions={<CreateBranchModal />}
      />

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <Building2 size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            All Branches
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[15px]">
            {branches.length.toLocaleString()} total
          </span>
        </div>

        <BranchesTable branches={branches} />
      </Card>
    </PageContainer>
  );
}
