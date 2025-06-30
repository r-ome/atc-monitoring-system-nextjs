import Link from "next/link";
import { getSuppliers } from "./actions";
import { Button } from "@/app/components/ui/button";
import { SuppliersTable } from "./suppliers-table";

export default async () => {
  const res = await getSuppliers();

  if (!res.ok) {
    return <div>Error Page</div>;
  }

  const suppliers = res.value;
  return (
    <>
      <Link href="suppliers/create">
        <Button>Create Supplier</Button>
      </Link>

      <div className="my-2">
        <SuppliersTable suppliers={suppliers} />
      </div>
    </>
  );
};
