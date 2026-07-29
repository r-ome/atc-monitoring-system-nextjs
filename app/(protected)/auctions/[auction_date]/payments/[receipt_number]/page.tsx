import Link from "next/link";
import { Receipt as ReceiptIcon } from "lucide-react";
import { getReceiptDetails } from "../actions";
import { getAuction } from "@/app/(protected)/auctions/actions";
import { Card } from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { Button } from "@/app/components/ui/button";
import { UpdatePaymentMethodModal } from "./UpdatePaymentMethodModal/UpdatePaymentMethodModal";
import { UndoPaymentButton } from "./UndoReceiptButton";
import AddStorageFeeModal from "./AddStorageFeeModal/AddStorageFeeModal";
import { cn, formatNumberToCurrency } from "@/app/lib/utils";
import { REFUND_PURPOSES } from "src/entities/models/Payment";
import { PageContainer } from "@/app/components/PageContainer";
import { AuctionSecondaryHeader } from "@/app/(protected)/auctions/components/AuctionSecondaryHeader";
import { AuctionSectionNav } from "@/app/(protected)/auctions/components/AuctionSectionNav";

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
    receipt_number,
  );
  if (!receipt_res.ok) {
    return <ErrorComponent error={receipt_res.error} />;
  }

  const receipt = receipt_res.value;
  const isRefund = REFUND_PURPOSES.includes(receipt.purpose);
  const initials = receipt.bidder.full_name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("");
  const isAmountSignedNegative = isRefund;
  const itemsCount = receipt.auctions_inventories?.length ?? 0;
  const canViewReceipt = !["REGISTRATION", "STORAGE_FEE"].includes(
    receipt.purpose,
  );
  const canAddStorage = ["PULL_OUT", "ADD_ON"].includes(receipt.purpose);

  return (
    <PageContainer>
      <AuctionSecondaryHeader
        auctionDate={auction_date}
        branchName={auction.branch.name}
        startedAt={auction.started_at}
        actions={
          <>
            {receipt.purpose === "PULL_OUT" ? (
              <UndoPaymentButton receipt_id={receipt.receipt_id} />
            ) : null}
            {canAddStorage ? (
              <AddStorageFeeModal receipt_id={receipt.receipt_id} />
            ) : null}
            {canViewReceipt ? (
              <Link href={`${receipt_number}/receipt`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto">View Receipt</Button>
              </Link>
            ) : null}
          </>
        }
      />

      <AuctionSectionNav basePath={`/auctions/${auction_date}`} />

      {/* Receipt header card */}
      <Card className="flex flex-row flex-wrap items-start justify-between gap-4 p-[18px] 2xl:p-5 2xl:text-[15px]">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent text-[15px] font-bold text-accent-foreground">
            {initials}
          </span>
          <div className="flex min-w-0 flex-col leading-tight">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[18px] font-semibold tracking-tight 2xl:text-[22px]">
                #{receipt.receipt_number}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-semibold uppercase",
                  isRefund
                    ? "bg-destructive/10 text-destructive"
                    : "bg-status-success/15 text-status-success",
                )}
                style={{ letterSpacing: "0.04em" }}
              >
                {receipt.purpose.replace(/_/g, " ")}
              </span>
            </div>
            <span className="text-[14px] text-foreground/80 2xl:text-[16px]">
              {receipt.bidder.full_name}
            </span>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground 2xl:text-[13.5px]">
              {receipt.purpose !== "REGISTRATION" ? (
                <span>
                  {itemsCount.toLocaleString()} item
                  {itemsCount === 1 ? "" : "s"}
                </span>
              ) : null}
              {isRefund && receipt.remarks ? (
                <span>
                  Reason:{" "}
                  <span className="text-destructive">{receipt.remarks}</span>
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className="caps-label text-[10.5px] 2xl:text-[13px]">
            Total Amount Paid
          </span>
          <span
            className={cn(
              "font-mono text-[24px] font-semibold tracking-tight 2xl:text-[28px]",
              isAmountSignedNegative
                ? "text-destructive"
                : "text-status-success",
            )}
          >
            {isAmountSignedNegative
              ? `(${formatNumberToCurrency(receipt.total_amount_paid)})`
              : formatNumberToCurrency(receipt.total_amount_paid)}
          </span>
          {receipt.storage_fee > 0 ? (
            <span className="text-[11.5px] text-muted-foreground 2xl:text-[13.5px]">
              includes {formatNumberToCurrency(receipt.storage_fee)} storage fee
            </span>
          ) : null}
        </div>
      </Card>

      {/* Payments table */}
      <Card className="flex flex-col gap-0 overflow-hidden p-0 2xl:text-[15px]">
        <div className="flex items-center gap-2 border-b px-[18px] py-3.5 2xl:px-5">
          <ReceiptIcon size={14} className="text-muted-foreground" />
          <span className="text-[14px] font-semibold 2xl:text-[17.5px]">
            Payments
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[14px]">
            {receipt.payments.length} payment entr
            {receipt.payments.length === 1 ? "y" : "ies"}
          </span>
        </div>

        <ul className="flex flex-col md:hidden">
          {receipt.payments.map((item, i) => (
            <li
              key={`m-${item.payment_id}`}
              className={cn(
                "flex flex-col gap-1 px-4 py-3",
                i !== receipt.payments.length - 1 && "border-b",
              )}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[12.5px] font-semibold">
                  {item.payment_method.name}
                </span>
                <span
                  className={cn(
                    "ml-auto font-mono text-[13px] font-semibold",
                    isRefund && "text-destructive",
                  )}
                >
                  {isRefund
                    ? `(${formatNumberToCurrency(item.amount_paid)})`
                    : formatNumberToCurrency(item.amount_paid)}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] text-muted-foreground">
                  {item.created_at}
                </span>
                {isRefund && receipt.remarks ? (
                  <span className="truncate text-[11px] text-muted-foreground">
                    · {receipt.remarks}
                  </span>
                ) : null}
                <span className="ml-auto">
                  <UpdatePaymentMethodModal payment={item} />
                </span>
              </div>
            </li>
          ))}
          <li className="flex items-baseline justify-between border-t px-4 py-3 bg-secondary/30">
            <span className="caps-label text-[11px]">Total</span>
            <span
              className={cn(
                "font-mono text-[14px] font-bold",
                isRefund && "text-destructive",
              )}
            >
              {isRefund
                ? `(${formatNumberToCurrency(receipt.total_amount_paid)})`
                : formatNumberToCurrency(receipt.total_amount_paid)}
            </span>
          </li>
        </ul>

        <div className="hidden overflow-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date &amp; Time</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead className="text-right">
                  Amount Paid{isRefund ? " to Bidder" : ""}
                </TableHead>
                {isRefund ? <TableHead>Reason</TableHead> : null}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipt.payments.map((item) => (
                <TableRow key={item.payment_id}>
                  <TableCell className="font-mono text-muted-foreground">
                    {item.created_at}
                  </TableCell>
                  <TableCell>{item.payment_method.name}</TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-medium",
                      isRefund && "text-destructive",
                    )}
                  >
                    {formatNumberToCurrency(item.amount_paid)}
                  </TableCell>
                  {isRefund ? (
                    <TableCell className="text-muted-foreground">
                      {receipt.remarks}
                    </TableCell>
                  ) : null}
                  <TableCell className="text-right">
                    <UpdatePaymentMethodModal payment={item} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={isRefund ? 2 : 1} />
                <TableCell className="caps-label text-right text-[11px]">
                  Total
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono font-semibold",
                    isRefund && "text-destructive",
                  )}
                >
                  {isRefund
                    ? `(${formatNumberToCurrency(receipt.total_amount_paid)})`
                    : formatNumberToCurrency(receipt.total_amount_paid)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Card>

      {/* Items table */}
      {canViewReceipt ? (
        <Card className="flex flex-col gap-0 overflow-hidden p-0 2xl:text-[15px]">
          <div className="flex items-center gap-2 border-b px-[18px] py-3.5 2xl:px-5">
            <span className="text-[14px] font-semibold 2xl:text-[17.5px]">
              Items under this receipt
            </span>
            <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[14px]">
              {itemsCount.toLocaleString()} item{itemsCount === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="flex max-h-[420px] flex-col overflow-y-auto md:hidden">
            {receipt.auctions_inventories?.map((item, i) => {
              const lastIndex =
                (receipt.auctions_inventories?.length ?? 0) - 1;
              return (
                <li
                  key={`m-${item.auction_inventory_id}`}
                  className={cn(
                    "flex flex-col gap-1 px-4 py-3",
                    i !== lastIndex && "border-b",
                  )}
                >
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-[12px] font-semibold">
                      {item.barcode}
                    </span>
                    <span className="font-mono text-[10.5px] text-muted-foreground">
                      · {item.control}
                    </span>
                    {item.manifest_number ? (
                      <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-foreground/80">
                        {item.manifest_number}
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="line-clamp-1 text-[13px] font-medium">
                      {item.description}
                    </span>
                    {item.qty ? (
                      <span className="font-mono text-[11px] text-muted-foreground">
                        ×{item.qty}
                      </span>
                    ) : null}
                    <span className="ml-auto font-mono text-[12.5px] font-semibold">
                      {item.price ? formatNumberToCurrency(item.price) : "—"}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="hidden max-h-[420px] overflow-auto md:block">
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead>Barcode</TableHead>
                  <TableHead>Control</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead>Manifest</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipt.auctions_inventories?.map((item) => (
                  <TableRow key={item.auction_inventory_id}>
                    <TableCell className="font-mono font-semibold">
                      {item.barcode}
                    </TableCell>
                    <TableCell className="font-mono">{item.control}</TableCell>
                    <TableCell className="text-foreground/90">
                      {item.description}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {item.price
                        ? formatNumberToCurrency(item.price)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {item.qty}
                    </TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {item.manifest_number || (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}
    </PageContainer>
  );
}
