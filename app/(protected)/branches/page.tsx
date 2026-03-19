import { getBranches } from "@/app/(protected)/branches/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { BranchesTable } from "./BranchTable";
import { CreateBranchModal } from "./CreateBranchModal";

export default async function Page() {
  const res = await getBranches();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const branches = res.value;
  return (
    <>
      <CreateBranchModal />

      <div className="my-2">
        <BranchesTable branches={branches} />
      </div>
    </>
  );
}
