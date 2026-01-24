"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pdf, PDFViewer } from "@react-pdf/renderer";
import { getAuction } from "@/app/(protected)/auctions/actions";
import { getReceiptDetails } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { ReceiptRecords } from "src/entities/models/Payment";
import BidderInvoiceDocument from "../OfficialReceiptPage/BidderInvoiceDocument";
import RefundDocument from "../RefundReceipt/RefundDocument";
import { Button } from "@/app/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  buildGroupIndexMap,
  getItemPriceWithServiceChargeAmount,
} from "@/app/lib/utils";

export default function ReceiptViewer() {
  const params: { auction_date: string; receipt_number: string } = useParams();
  const { auction_date, receipt_number } = params;
  const [receipt, setReceipt] = useState<ReceiptRecords>();

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getAuction(auction_date);

      if (!res.ok) return;
      const receipt_res = await getReceiptDetails(
        res.value.auction_id,
        receipt_number,
      );
      if (!receipt_res.ok) return;
      setReceipt(receipt_res.value);
    };

    fetchInitialData();
  }, [auction_date, receipt_number]);

  if (!receipt) {
    return (
      <div className="w-full h-[80vh] flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const ReceiptDocument = () => {
    if (receipt.purpose === "REFUNDED")
      return <RefundDocument receipt={receipt} />;
    if (receipt.purpose === "PULL_OUT") {
      const total_item_price = receipt.auctions_inventories.reduce(
        (acc: number, item) => {
          return (acc = acc + (item.price ? item.price : 0));
        },
        0,
      );

      const receiptNumber = receipt.receipt_number.split("-")[1];
      const less =
        parseInt(receiptNumber, 10) > 1 ? 0 : receipt.bidder.registration_fee;
      const service_charge_amount =
        (total_item_price * receipt.bidder.service_charge) / 100;
      const number_of_items = receipt.auctions_inventories?.length || 0;

      const grandTotal =
        getItemPriceWithServiceChargeAmount(
          total_item_price,
          receipt.bidder.service_charge,
        ) - less;

      const groupIndexMap = buildGroupIndexMap(
        receipt.auctions_inventories,
        (r) => r.is_slash_item,
      );
      receipt.auctions_inventories = receipt.auctions_inventories.map(
        (item) => {
          const isSlashItem = item.is_slash_item;
          const idx = isSlashItem ? groupIndexMap[isSlashItem] : undefined;
          return {
            auction_inventory_id: item.auction_inventory_id,
            barcode: item.barcode || "NO BARCODE",
            description: item.description || "NO DESCRIPTION",
            qty: item.qty || "NO QTY",
            price: item.price || 0,
            control: `${idx ? `(A${idx})` : ""} ${item.control}`,
          };
        },
      );

      return (
        <BidderInvoiceDocument
          receipt={receipt}
          computation={{
            service_charge: receipt.bidder.service_charge,
            service_charge_amount,
            less,
            number_of_items,
            total_item_price,
            grandTotal,
          }}
        />
      );
    }
    return null;
  };

  async function printPdf() {
    const blob = await pdf(<ReceiptDocument />).toBlob();
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "100%"; // Hide the iframe off-screen
    iframe.style.bottom = "100%";
    iframe.src = url;

    iframe.onload = () => {
      // Once the content is loaded, trigger the print dialog within the iframe
      iframe.contentWindow?.print();
    };

    document.body.appendChild(iframe);
  }

  return (
    <div className="flex flex-col gap-4 items-center">
      <div>
        <Button className="w-full" onClick={printPdf}>
          PRINT RECEIPT
        </Button>
      </div>

      {/* <PDFDownloadLink
        fileName={receipt.receipt_number}
        document={<ReceiptDocument />}
      >
        {({ loading }) => (
          <Button className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            PRINT RECEIPT
          </Button>
        )}
      </PDFDownloadLink> */}

      <PDFViewer className="w-full h-screen">
        <ReceiptDocument />
      </PDFViewer>
    </div>
  );
}
