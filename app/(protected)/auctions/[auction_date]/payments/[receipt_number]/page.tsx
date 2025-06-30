import { getReceiptDetails } from "../actions";
import { getAuction } from "@/app/(protected)/auctions/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableCaption,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";

export default async function Page({
  params,
}: Readonly<{ params: { auction_date: string; receipt_number: string } }>) {
  const { auction_date, receipt_number } = await params;
  const auction_res = await getAuction(auction_date);
  if (!auction_res.ok) {
    return <div>Error Page</div>;
  }
  const auction = auction_res.value;

  const receipt_res = await getReceiptDetails(
    auction.auction_id,
    receipt_number
  );

  if (!receipt_res.ok) {
    return <div>Error Page</div>;
  }

  const receipt = receipt_res.value;

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>
            {receipt.receipt_number} {receipt.bidder.full_name}
          </CardTitle>
          <CardDescription>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <p className="leading-7 text-md">
                  <Badge
                    variant={
                      receipt.purpose === "REFUNDED" ? "destructive" : "success"
                    }
                  >
                    {receipt.purpose.replace(/_/g, " ")}
                  </Badge>
                </p>
              </div>

              {receipt.purpose !== "REGISTRATION" ? (
                <div className="flex flex-col items-center">
                  <p className="leading-7 text-md w-fit">
                    TOTAL ITEMS: {receipt.auctions_inventories?.length} items
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col items-center">
                <p className="leading-7 text-md w-fit">
                  TOTAL AMOUNT PAID: ₱
                  {receipt.total_amount_paid.toLocaleString()}
                </p>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>Amount Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.payments.map((item) => (
                  <TableRow key={item.payment_id}>
                    <TableCell>{item.created_at}</TableCell>
                    <TableCell>{item.payment_type}</TableCell>
                    <TableCell>₱ {item.amount_paid.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={1}></TableCell>
                  <TableCell className="font-bold text-right">
                    Total Amount Paid
                  </TableCell>
                  <TableCell className="font-bold">
                    ₱ {receipt.total_amount_paid.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>

            {receipt.purpose !== "REGISTRATION" ? (
              <div className="max-h-[300px] overflow-y-auto relative">
                <Table>
                  <TableCaption>
                    A list of all items under this receipt.
                  </TableCaption>
                  <TableHeader className="sticky top-0 bg-secondary">
                    <TableRow>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Control</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>QTY</TableHead>
                      <TableHead>Manifest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receipt.auctions_inventories?.map((item) => (
                      <TableRow key={item.auction_inventory_id}>
                        <TableCell>{item.barcode}</TableCell>
                        <TableCell>{item.control}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.price?.toLocaleString()}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{item.manifest_number}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
