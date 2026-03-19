import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { getSupplierBySupplierCode } from "../actions";
import { UpdateSupplierModal } from "./UpdateSupplierModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { SupplierContainersTable } from "./SupplierContainersTable";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ supplier_code: string }> }>) {
  const { supplier_code } = await params;
  const res = await getSupplierBySupplierCode(supplier_code);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const supplier = res.value;
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between">
              <div>
                {supplier.name} ({supplier_code})
              </div>
              <div>
                <UpdateSupplierModal supplier={supplier} />
              </div>
            </div>
          </CardTitle>
          <CardDescription>
            <div>Email: {supplier.email}</div>
            <div>Contact Number: {supplier.contact_number}</div>
            <div>
              Sales Remittance Account: {supplier.sales_remittance_account}
            </div>
            <div>Commission: {supplier.commission}</div>
            <div>Shipper: {supplier.shipper}</div>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Container List</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierContainersTable containers={supplier.containers} />
        </CardContent>
      </Card>
    </div>
  );
}
