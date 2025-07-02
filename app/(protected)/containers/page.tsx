"use server";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { getContainers } from "./actions";
import { ContainersTable } from "./container-table";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page() {
  const res = await getContainers();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const containers = res.value;

  return (
    <>
      <Link href="containers/create">
        <Button>Create Container</Button>
      </Link>

      <div className="my-2">
        <ContainersTable containers={containers} />
      </div>
    </>
  );
}
