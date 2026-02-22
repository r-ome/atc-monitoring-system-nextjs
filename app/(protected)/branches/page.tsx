import { getBranches } from "@/app/(protected)/branches/actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./branch-columns";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { BranchsTable } from "./BranchTable";

export default async function Page() {
  const res = await getBranches();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const branches = res.value;
  return (
    <>
      <Link href="branches/create">
        <Button>Create Branch</Button>
      </Link>

      <div className="my-2">
        <BranchsTable branches={branches} />
      </div>
    </>
  );
}
