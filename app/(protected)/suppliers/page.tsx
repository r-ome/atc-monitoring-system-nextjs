import Link from "next/link";
import { Truck } from "lucide-react";
import { getSuppliers } from "./actions";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
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

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <Truck size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            All Suppliers
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[15px]">
            {suppliers.length.toLocaleString()} total
          </span>
        </div>

        <SuppliersTable suppliers={suppliers} />
      </Card>
    </PageContainer>
  );
}
