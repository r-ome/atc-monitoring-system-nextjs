import { getBranches } from "@/app/(protected)/branches/actions";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { DataTable } from "@/app/components/data-table/data-table";
import { columns } from "./branch-columns";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async () => {
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
        <DataTable columns={columns} data={branches} />
      </div>
    </>
  );
};
