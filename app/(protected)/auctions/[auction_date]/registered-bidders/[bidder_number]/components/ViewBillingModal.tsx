"use client";

import { Loader2Icon } from "lucide-react";
import { useState, useEffect, SetStateAction } from "react";
import { PDFViewer, PDFDownloadLink } from "@react-pdf/renderer";
import { getBidderReceipts } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { PAYMENT_PURPOSE, ReceiptRecords } from "src/entities/models/Payment";
import { Button } from "@/app/components/ui/button";
import BidderInvoiceDocument from "@/app/(protected)/auctions/[auction_date]/payments/[receipt_number]/OfficialReceiptPage/BidderInvoiceDocument";
import RefundDocument from "@/app/(protected)/auctions/[auction_date]/payments/[receipt_number]/RefundReceipt/RefundDocument";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { useBidderPullOutModalContext } from "../context/BidderPullOutModalContext";
import { DialogDescription } from "@radix-ui/react-dialog";

interface ViewBillingModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
}

export const ViewBillingModal: React.FC<ViewBillingModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { registeredBidder, selectedItems } = useBidderPullOutModalContext();
  const [receipt, setReceipt] =
    useState<Omit<ReceiptRecords, "payments" | "created_at">>();
  const [receiptNumber, setReceiptNumber] = useState<string>();

  useEffect(() => {
    if (!registeredBidder?.auction_bidder_id) return;

    const fetchInitialData = async () => {
      const res = await getBidderReceipts(registeredBidder.auction_bidder_id);
      if (res.ok) {
        const pull_out_receipts = res.value
          .filter((item) => item.purpose === "PULL_OUT")
          .map((item) => parseInt(item.receipt_number.split("-")[1], 10));

        if (pull_out_receipts.length) {
          const latest_receipt_number = Math.max(...pull_out_receipts);
          setReceiptNumber(
            `${registeredBidder.bidder.bidder_number}-${latest_receipt_number}`
          );
        } else {
          setReceiptNumber(`${registeredBidder.bidder.bidder_number}-1`);
        }
      }
    };

    fetchInitialData();
  }, [
    registeredBidder?.auction_bidder_id,
    registeredBidder?.bidder.bidder_number,
  ]);

  useEffect(() => {
    if (!registeredBidder) return;

    const items = selectedItems.length
      ? selectedItems
      : registeredBidder.auction_inventories.filter(
          (item) => item.status === "UNPAID"
        );

    const receipt = {
      receipt_id: "BILLING",
      receipt_number: receiptNumber || registeredBidder.bidder.bidder_number,
      auction_bidder_id: registeredBidder.auction_bidder_id,
      total_amount_paid: 0,
      purpose: "PULL_OUT" as PAYMENT_PURPOSE,
      auction_date: registeredBidder.auction_date,
      bidder: {
        bidder_id: registeredBidder.bidder.bidder_id,
        bidder_number: registeredBidder.bidder.bidder_number,
        full_name: registeredBidder.bidder.full_name,
        registration_fee: registeredBidder.registration_fee,
        service_charge: registeredBidder.service_charge,
        already_consumed: registeredBidder.already_consumed,
      },
      auctions_inventories: items.map((item) => ({
        auction_inventory_id: item.auction_inventory_id,
        barcode: item.inventory.barcode,
        control: item.inventory.control,
        description: item.description,
        qty: item.qty,
        price: item.price,
        manifest_number: item.manifest_number,
      })),
    };

    setReceipt(receipt);
  }, [registeredBidder, selectedItems, receiptNumber]);

  if (!receipt) return;

  const ReceiptDocument = () => {
    if (receipt.purpose === "REFUNDED")
      return <RefundDocument receipt={receipt} />;
    if (receipt.purpose === "PULL_OUT")
      return <BidderInvoiceDocument receipt={receipt} />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[1000px] max-h-[700px]">
        <DialogHeader>
          <DialogTitle>Billing</DialogTitle>
          <DialogDescription>Billing</DialogDescription>
        </DialogHeader>

        {receipt.auctions_inventories.length ? (
          <div className="flex-1 overflow-hidden min-h-[500px]">
            <PDFViewer className="w-full h-full" showToolbar={false}>
              <ReceiptDocument />
            </PDFViewer>
          </div>
        ) : (
          <div>
            <h1>No Items Available</h1>
          </div>
        )}

        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button onClick={() => onOpenChange(false)} variant="outline">
              Close
            </Button>
          </DialogClose>
          <PDFDownloadLink
            fileName={receipt.receipt_number}
            document={<ReceiptDocument />}
          >
            {({ loading }) => (
              <Button className="w-full" disabled={loading}>
                {loading && <Loader2Icon className="animate-spin" />}
                Download Receipt
              </Button>
            )}
          </PDFDownloadLink>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
