import { useEffect, useState } from "react";
import { Document, Page, Font, View, StyleSheet } from "@react-pdf/renderer";

import RefundHeading from "./RefundHeading";
import RefundTableHeader from "./RefundTableHeader";
import RefundReceiptTop from "./RefundReceiptTop";
import RefundTableRow from "./RefundTableRow";

import RefundTableFooter from "./RefundTableFooter";
import RefundSignatories from "./RefundSignatories";
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

interface RefundDocumentProps {
  receipt: Omit<ReceiptRecords, "payments" | "created_at">;
}

const RefundDocument: React.FC<RefundDocumentProps> = ({ receipt }) => {
  const [reason, setReason] = useState<string | null>();

  useEffect(() => {
    if (
      receipt.auctions_inventories.length &&
      receipt.auctions_inventories[0]
    ) {
      setReason(receipt.remarks);
    }
  }, [receipt.auctions_inventories, receipt.remarks]);

  return (
    <Document pageMode="fullScreen">
      <Page size="A4" style={styles.page} wrap={true}>
        <RefundReceiptTop receiptNumber={receipt.receipt_number} />
        <RefundHeading
          receiptNumber={receipt.receipt_number}
          auctionDate={receipt.auction_date}
        />
        <View
          style={{
            display: "flex",
            width: 580,
            borderRight: 1,
            borderLeft: 1,
          }}
        >
          <RefundTableHeader />
          <RefundTableRow items={receipt.auctions_inventories} />
        </View>
        <View>
          <RefundTableFooter reason={reason} />
          <RefundSignatories />
        </View>
      </Page>
    </Document>
  );
};

export default RefundDocument;
