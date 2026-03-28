"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { pdf, PDFViewer, DocumentProps } from "@react-pdf/renderer";
import { getAuction } from "@/app/(protected)/auctions/actions";
import { getReceiptDetails, getStorageFeeTotal } from "@/app/(protected)/auctions/[auction_date]/payments/actions";
import { ReceiptRecords, REFUND_PURPOSES } from "src/entities/models/Payment";
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
  const [storageFeeTotal, setStorageFeeTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getAuction(auction_date);
      if (!res.ok) { setIsLoading(false); return; }

      const receipt_res = await getReceiptDetails(
        res.value.auction_id,
        receipt_number,
      );
      if (!receipt_res.ok) { setIsLoading(false); return; }
      setReceipt(receipt_res.value);

      const sfTotal = await getStorageFeeTotal(receipt_number);
      setStorageFeeTotal(sfTotal);
      setIsLoading(false);
    };

    fetchInitialData();
  }, [auction_date, receipt_number]);

  if (isLoading || !receipt) {
    return (
      <div className="w-full h-[80vh] flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  const isViewable =
    REFUND_PURPOSES.includes(receipt.purpose) || receipt.purpose === "PULL_OUT";

  if (!isViewable) {
    return (
      <div className="w-full h-[80vh] flex justify-center items-center">
        <p className="text-muted-foreground">
          No printable receipt for this record.
        </p>
      </div>
    );
  }

  // Build the document element at the top level — never inside a nested component.
  let documentElement: React.ReactElement<DocumentProps>;

  if (REFUND_PURPOSES.includes(receipt.purpose)) {
    documentElement = <RefundDocument receipt={receipt} />;
  } else {
    const total_item_price = receipt.auctions_inventories.reduce(
      (acc: number, item) => acc + (item.price ?? 0),
      0,
    );

    const receiptNumber = receipt.receipt_number.split("-")[1];
    const less =
      parseInt(receiptNumber, 10) > 1 ? 0 : receipt.bidder.registration_fee;
    const service_charge_amount =
      (total_item_price * receipt.bidder.service_charge) / 100;
    const number_of_items = receipt.auctions_inventories?.length ?? 0;
    const grandTotal =
      getItemPriceWithServiceChargeAmount(
        total_item_price,
        receipt.bidder.service_charge,
      ) -
      less +
      storageFeeTotal;

    const groupIndexMap = buildGroupIndexMap(
      receipt.auctions_inventories,
      (r) => r.is_slash_item,
    );
    const transformedInventories = receipt.auctions_inventories.map((item) => {
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
    });

    documentElement = (
      <BidderInvoiceDocument
        receipt={{ ...receipt, auctions_inventories: transformedInventories }}
        computation={{
          service_charge: receipt.bidder.service_charge,
          service_charge_amount,
          less,
          number_of_items,
          total_item_price,
          storage_fee: storageFeeTotal,
          grandTotal,
        }}
      />
    );
  }

  async function printPdf() {
    const blob = await pdf(documentElement).toBlob();
    const url = URL.createObjectURL(blob);
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "100%";
    iframe.style.bottom = "100%";
    iframe.src = url;
    iframe.onload = () => {
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

      <PDFViewer className="w-full h-screen">
        {documentElement}
      </PDFViewer>
    </div>
  );
}
