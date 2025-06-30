import { getInventory } from "@/app/(protected)/inventories/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";

import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
} from "@/app/components/ui/table";
import { UpdateInventoryModal } from "./UpdateInventoryModal";

export default async function ({
  params,
}: Readonly<{ params: { inventory_id: string } }>) {
  const { inventory_id } = await params;
  const res = await getInventory(inventory_id);
  if (!res.ok) {
    return <div>Error Page</div>;
  }

  const inventory = res.value;
  return (
    <div className="flex flex-col space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between">
              {inventory.barcode}
              <UpdateInventoryModal inventory={inventory} />
            </div>
          </CardTitle>
          <CardDescription>
            <div>Control: {inventory.control}</div>
            <div>Description: {inventory.description}</div>
          </CardDescription>
        </CardHeader>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Auction Status</TableHead>
            <TableHead>Inventory Status</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead>Remarks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.histories.map((item) => (
            <TableRow key={item.inventory_history_id}>
              <TableCell>{item.created_at}</TableCell>
              <TableCell>{item.auction_status}</TableCell>
              <TableCell>{item.inventory_status}</TableCell>
              <TableCell>{item.receipt_id}</TableCell>
              <TableCell>{item.remarks}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
