import { getContainers } from "./actions";
import { ContainersTable } from "./container-table";
import { CreateContainerModal } from "./CreateContainerModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { requireUser } from "@/app/lib/auth";

export default async function Page() {
  const [user, res] = await Promise.all([requireUser(), getContainers()]);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const containers = res.value;

  return (
    <PageContainer>
      <PageHeader
        title="Containers"
        subtitle="Track containers, due dates, and inventories"
        actions={<CreateContainerModal />}
      />

      <ContainersTable containers={containers} userRole={user.role} />
    </PageContainer>
  );
}
