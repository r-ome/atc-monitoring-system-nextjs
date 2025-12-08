import Link from "next/link";
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
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Button } from "@/app/components/ui/button";
import { UpdateRegistrationPaymentMethodModal } from "./UpdateRegistrationPaymentMethodModal/UpdateRegistrationPaymentMethodModal";
import { UndoPaymentButton } from "./UndoReceiptButton";
import { cn } from "@/app/lib/utils";

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ auction_date: string; receipt_number: string }>;
}>) {
  const { auction_date, receipt_number } = await params;
  const auction_res = await getAuction(auction_date);
  if (!auction_res.ok) {
    return <ErrorComponent error={auction_res.error} />;
  }
  const auction = auction_res.value;

  const receipt_res = await getReceiptDetails(
    auction.auction_id,
    receipt_number
  );

  if (!receipt_res.ok) {
    return <ErrorComponent error={receipt_res.error} />;
  }

  const receipt = receipt_res.value;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex justify-between">
            <div>
              {receipt.receipt_number} {receipt.bidder.full_name}
            </div>

            <div className="flex gap-2">
              {receipt.purpose === "PULL_OUT" ? (
                <UndoPaymentButton receipt_id={receipt.receipt_id} />
              ) : null}

              {!["REGISTRATION"].includes(receipt.purpose) ? (
                <Link href={`${receipt_number}/receipt`}>
                  <Button>View Receipt</Button>
                </Link>
              ) : null}
            </div>
          </div>
        </CardTitle>
        <CardDescription>
          <div className="flex gap-4">
            <div className="flex flex-col justify-start items-start gap-2">
              <div className="flex">
                <div className="leading-7 text-md">
                  <Badge
                    variant={
                      receipt.purpose === "REFUNDED" ? "destructive" : "success"
                    }
                  >
                    {receipt.purpose.replace(/_/g, " ")}
                  </Badge>
                </div>
                {receipt.purpose === "REFUNDED" ? (
                  <div className="font-black text-lg ml-4">
                    REASON: {receipt.remarks}
                  </div>
                ) : null}
              </div>

              {receipt.purpose !== "REGISTRATION" ? (
                <div className="flex flex-col items-center">
                  <p className="leading-7 text-md w-fit">
                    TOTAL ITEMS: {receipt.auctions_inventories?.length} items
                  </p>
                </div>
              ) : null}

              {/* <div className="flex flex-col items-center">
                <p className="leading-7 text-md w-fit">
                  TOTAL AMOUNT PAID: ₱
                  {receipt.total_amount_paid.toLocaleString()}
                </p>
              </div> */}
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
                <TableHead>Payment Method</TableHead>
                <TableHead>
                  Amount Paid{" "}
                  {receipt.purpose === "REFUNDED" ? "to Bidder" : ""}
                </TableHead>
                {["REFUNDED"].includes(receipt.purpose) ? (
                  <>
                    <TableHead className="w-20">Reason</TableHead>
                  </>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipt.payments.map((item) => (
                <TableRow key={item.payment_id}>
                  <TableCell>{item.created_at}</TableCell>
                  <TableCell>{item.payment_method.name}</TableCell>
                  <TableCell>
                    <div
                      className={cn(
                        receipt.purpose === "REFUNDED" ? "text-red-500" : ""
                      )}
                    >
                      ₱ {item.amount_paid.toLocaleString()}
                    </div>
                  </TableCell>
                  {receipt.purpose === "REGISTRATION" ? (
                    <>
                      <TableCell className="flex justify-end">
                        <UpdateRegistrationPaymentMethodModal
                          receipt={receipt}
                          payment={item}
                        />
                      </TableCell>
                    </>
                  ) : null}
                  {receipt.purpose === "REFUNDED" ? (
                    <>
                      <TableCell>{receipt?.remarks}</TableCell>
                    </>
                  ) : null}
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
                  <div
                    className={cn(
                      receipt.purpose === "REFUNDED" ? "text-red-500" : ""
                    )}
                  >
                    ₱ {receipt.total_amount_paid.toLocaleString()}
                  </div>
                </TableCell>
                {receipt.purpose === "REFUNDED" ? (
                  <TableCell></TableCell>
                ) : null}
              </TableRow>
            </TableFooter>
          </Table>

          {receipt.purpose !== "REGISTRATION" ? (
            <div className="max-h-[400px] overflow-y-auto relative">
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
  );
}
