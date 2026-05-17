import { Container } from "lucide-react";
import { getContainers } from "./actions";
import { ContainersTable } from "./container-table";
import { CreateContainerModal } from "./CreateContainerModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { Card } from "@/app/components/ui/card";
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

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <Container size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            All Containers
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[15px]">
            {containers.length.toLocaleString()} total
          </span>
        </div>

        <ContainersTable containers={containers} userRole={user.role} />
      </Card>
    </PageContainer>
  );
}
