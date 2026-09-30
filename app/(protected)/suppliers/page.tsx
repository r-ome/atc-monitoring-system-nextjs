import Link from "next/link";
import { getSuppliers } from "./actions";
import { Button } from "@/app/components/ui/button";
import { SuppliersTable } from "./suppliers-table";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { requireUser } from "@/app/lib/auth";
import { SUPPLIER_MANAGEMENT_ROLES } from "@/app/lib/supplier-permissions";

export default async function Page() {
  const [user, res] = await Promise.all([requireUser(), getSuppliers()]);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const suppliers = res.value;
  const canManageSuppliers = SUPPLIER_MANAGEMENT_ROLES.includes(user.role);
  return (
    <PageContainer>
      <PageHeader
        title="Suppliers"
        subtitle="Manage supplier records"
        actions={
          canManageSuppliers && (
            <Link href="/suppliers/create">
              <Button>Create Supplier</Button>
            </Link>
          )
        }
      />

      <SuppliersTable
        suppliers={suppliers}
        canManageSuppliers={canManageSuppliers}
      />
    </PageContainer>
  );
}
