"use client";

import { useEffect, useState } from "react";
import { Document, Page, Font, View, StyleSheet } from "@react-pdf/renderer";

import InvoiceHeading from "./InvoiceHeading";
import InvoiceTableHeader from "./InvoiceTableHeader";
import BidderReceiptTop from "./BidderReceiptTop";
import BidderReceiptBottom from "./BidderReceiptBottom";
import InvoiceTableRow from "./InvoiceTableRow";

import InvoiceTableFooter from "./InvoiceTableFooter";
import InvoiceTermsAndConditions from "./InvoiceTermsAndConditions";
import InvoiceSignatories from "./InvoiceSignatories";
import { ReceiptRecords } from "src/entities/models/Payment";

Font.register({
  family: "Arial",
  fonts: [
    { src: "/fonts/arial/ARIAL.TTF" },
    {
      src: "/fonts/arial/ArialCEMTBlack.ttf",
      fontWeight: "bold",
    },
  ],
});

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Arial",
    flexDirection: "column",
    backgroundColor: "#fff",
    paddingTop: 5,
    paddingLeft: 5,
    paddingBottom: 50,
  },
});

export interface BidderInvoiceDocumentProps {
  receipt: Omit<ReceiptRecords, "payments" | "created_at">;
}

export type Computation = {
  number_of_items: number;
  total_item_price: number;
  service_charge: number;
  service_charge_amount: number;
  less: number;
  grandTotal: number;
};

// export type Signatories = {
//   isPartial: boolean;
//   purpose?: PAYMENT_PURPOSE;
//   amountPaid?: number;
//   balance?: number;
//   full_name: string;
// };

const BidderInvoiceDocument: React.FC<BidderInvoiceDocumentProps> = ({
  receipt,
}) => {
  const [computation, setComputation] = useState<Computation>({
    number_of_items: 0,
    total_item_price: 0,
    service_charge: 0,
    service_charge_amount: 0,
    less: 0,
    grandTotal: 0,
  });

  const chunkSize = 28;
  const newArr = [];
  for (let i = 0; i < receipt.auctions_inventories.length; i += chunkSize) {
    const chunk = receipt.auctions_inventories
      .slice(i, i + chunkSize)
      .map((item) => ({
        barcode: item.barcode || "NO BARCODE",
        control: item.control || "NC",
        description: item.description || "NO DESCRIPTION",
        qty: item.qty || "NO QTY",
        price: item.price || 0,
        bidder: receipt.bidder.bidder_number,
      }));
    newArr.push(chunk);
  }

  const total_item_price = receipt.auctions_inventories.reduce(
    (acc: number, item) => {
      return (acc = acc + (item.price ? item.price : 0));
    },
    0
  );

  useEffect(() => {
    if (!receipt) return;
    const receiptNumber = receipt.receipt_number.split("-")[1];
    const less =
      parseInt(receiptNumber, 10) > 1 ? 0 : receipt.bidder.registration_fee;
    const service_charge_amount =
      (total_item_price * receipt.bidder.service_charge) / 100;
    const number_of_items = receipt.auctions_inventories?.length || 0;

    const grandTotal =
      total_item_price +
      (total_item_price * receipt.bidder.service_charge) / 100 -
      less;

    setComputation({
      service_charge: receipt.bidder.service_charge,
      service_charge_amount,
      less,
      number_of_items,
      total_item_price,
      grandTotal,
    });
  }, [receipt, total_item_price]);

  return (
    <Document pageMode="fullScreen">
      {newArr.map((item, i: number, arr) => {
        return (
          <Page size="A4" key={i} style={styles.page} wrap={true}>
            <BidderReceiptTop receiptNumber={receipt.receipt_number} />
            {i === 0 ? (
              <InvoiceHeading
                heading={{
                  auction_date: receipt.auction_date,
                  full_name: receipt.bidder.full_name,
                  receipt_number: receipt.receipt_number,
                }}
              />
            ) : (
              <View fixed style={{ marginBottom: 40 }}></View>
            )}
            <View
              style={{
                display: "flex",
                width: 585,
                borderRight: 1,
                borderLeft: 1,
              }}
            >
              <InvoiceTableHeader />
              <InvoiceTableRow items={item} />
            </View>
            {i === arr.length - 1 ? (
              <View>
                <InvoiceTableFooter computation={computation} />
                <InvoiceTermsAndConditions />
                <InvoiceSignatories full_name={receipt.bidder.full_name} />
              </View>
            ) : null}
            <BidderReceiptBottom receiptNumber={receipt.receipt_number} />
          </Page>
        );
      })}
    </Document>
  );
};

export default BidderInvoiceDocument;
