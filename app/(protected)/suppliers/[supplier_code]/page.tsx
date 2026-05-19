import { Card } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { getSupplierBySupplierCode } from "../actions";
import { UpdateSupplierModal } from "./UpdateSupplierModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { SupplierContainersTable } from "./SupplierContainersTable";
import { SupplierBreadcrumb } from "./SupplierBreadcrumb";
import { PageContainer } from "@/app/components/PageContainer";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ supplier_code: string }> }>) {
  const { supplier_code } = await params;
  const res = await getSupplierBySupplierCode(supplier_code);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const supplier = res.value;

  const details: { label: string; value: string }[] = [
    { label: "Email", value: supplier.email || "—" },
    { label: "Contact Number", value: supplier.contact_number || "—" },
    {
      label: "Sales Remittance Account",
      value: supplier.sales_remittance_account || "—",
    },
    { label: "Commission", value: `${supplier.commission}` },
    { label: "Shipper", value: supplier.shipper || "—" },
  ];

  return (
    <PageContainer>
      <SupplierBreadcrumb
        supplierCode={supplier_code}
        supplierName={supplier.name}
      />

      <Card className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:gap-6 sm:p-5 2xl:p-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="secondary">{supplier_code}</Badge>
            {supplier.japanese_name ? (
              <span className="text-[12.5px] text-muted-foreground">
                {supplier.japanese_name}
              </span>
            ) : null}
          </div>
          <h1 className="truncate text-[18px] font-semibold tracking-tight sm:text-[22px] 2xl:text-[28px]">
            {supplier.name}
          </h1>
        </div>
        <div className="grid w-full grid-cols-1 gap-2 [&>*]:w-full [&_button]:w-full sm:flex sm:w-auto sm:[&>*]:w-auto sm:[&_button]:w-auto">
          <UpdateSupplierModal supplier={supplier} />
        </div>
      </Card>

      <Card className="grid grid-cols-1 gap-x-6 gap-y-2 p-3.5 sm:grid-cols-2 lg:grid-cols-3 2xl:p-5">
        {details.map((d) => (
          <div key={d.label} className="flex flex-col gap-0.5">
            <span className="text-[11.5px] uppercase tracking-wide text-muted-foreground 2xl:text-[13px]">
              {d.label}
            </span>
            <span className="text-[14px] 2xl:text-[16px]">{d.value}</span>
          </div>
        ))}
      </Card>

      <SupplierContainersTable containers={supplier.containers} />
    </PageContainer>
  );
}
