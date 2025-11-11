"use client";

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
    paddingLeft: 10,
    paddingBottom: 50,
  },
});

export interface BidderInvoiceDocumentProps {
  receipt: Omit<ReceiptRecords, "payments" | "created_at">;
  computation: Computation;
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
  computation,
}) => {
  const chunkSize = 33;
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
