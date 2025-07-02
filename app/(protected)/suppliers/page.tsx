import Link from "next/link";
import { getSuppliers } from "./actions";
import { Button } from "@/app/components/ui/button";
import { SuppliersTable } from "./suppliers-table";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page() {
  const res = await getSuppliers();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
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
}
