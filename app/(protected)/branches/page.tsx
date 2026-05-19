import { getBranches } from "@/app/(protected)/branches/actions";
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

      <BranchesTable branches={branches} />
    </PageContainer>
  );
}
