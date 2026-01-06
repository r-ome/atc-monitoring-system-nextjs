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
import { Badge } from "@/app/components/ui/badge";
import { formatDate } from "@/app/lib/utils";

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
              <TableHead>Branch</TableHead>
              <TableHead>Arrival Date</TableHead>
              <TableHead>Due Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {supplier.containers
              .sort((a, b) => a.barcode.localeCompare(b.barcode))
              .map((container) => (
                <TableRow key={container.container_id}>
                  <TableCell>{container.barcode}</TableCell>
                  <TableCell>{container.inventories.length}</TableCell>
                  <TableCell>{container.sold_items}</TableCell>
                  <TableCell>{container.unsold_items}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        container.branch.name === "TARLAC"
                          ? "success"
                          : "warning"
                      }
                    >
                      {container.branch.name}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {container.arrival_date
                      ? formatDate(container.arrival_date)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {container.due_date
                      ? formatDate(container.due_date)
                      : "N/A"}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
