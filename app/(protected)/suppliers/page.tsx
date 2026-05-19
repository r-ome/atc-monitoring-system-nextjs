import Link from "next/link";
import { getSuppliers } from "./actions";
import { Button } from "@/app/components/ui/button";
import { SuppliersTable } from "./suppliers-table";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";

export default async function Page() {
  const res = await getSuppliers();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const suppliers = res.value;
  return (
    <PageContainer>
      <PageHeader
        title="Suppliers"
        subtitle="Manage supplier records"
        actions={
          <Link href="suppliers/create">
            <Button>Create Supplier</Button>
          </Link>
        }
      />

      <SuppliersTable suppliers={suppliers} />
    </PageContainer>
  );
}
