import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { getSupplierBySupplierCode } from "../actions";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { UpdateSupplierModal } from "./UpdateSupplierModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";

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
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barcode</TableHead>
              <TableHead>Number of Items</TableHead>
              <TableHead>SOLD items</TableHead>
              <TableHead>UNSOLD items</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplier.containers.map((container) => (
              <TableRow key={container.container_id}>
                <TableCell>{container.barcode}</TableCell>
                <TableCell>{container.inventories.length}</TableCell>
                <TableCell>{container.sold_items}</TableCell>
                <TableCell>{container.unsold_items}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
