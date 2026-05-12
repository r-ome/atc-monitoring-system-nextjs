import { getContainers } from "./actions";
import { ContainersTable } from "./container-table";
import { CreateContainerModal } from "./CreateContainerModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { requireUser } from "@/app/lib/auth";

export default async function Page() {
  const [user, res] = await Promise.all([requireUser(), getContainers()]);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const containers = res.value;

  return (
    <>
      <CreateContainerModal />

      <div className="my-2">
        <ContainersTable containers={containers} userRole={user.role} />
      </div>
    </>
  );
}
