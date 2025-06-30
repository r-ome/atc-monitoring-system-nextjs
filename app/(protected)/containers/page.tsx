"use server";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { getContainers } from "./actions";
import { ContainersTable } from "./container-table";

export default async () => {
  const res = await getContainers();

  if (!res.ok) {
    return <div>Error Page</div>;
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
};
