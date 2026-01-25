import {
  Document,
  Page,
  Font,
  View,
  Text,
  StyleSheet,
  Image as PDFImage,
} from "@react-pdf/renderer";
import { getYear } from "date-fns";

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
    paddingLeft: 2,
    paddingRight: 2,
    paddingBottom: 50,
  },
});

interface BidderNumberDocumentProps {
  bidder_number: string;
  branch_name: string;
  full_name: string;
}

const BidderNumberDocument: React.FC<BidderNumberDocumentProps> = ({
  bidder_number,
  branch_name,
  full_name,
}) => {
  return (
    <Document pageMode="fullScreen">
      <Page size="A4" orientation="landscape" style={styles.page} wrap={true}>
        <View fixed style={{ display: "flex", width: "100%" }}>
          <View
            fixed
            style={{ marginBottom: 10, borderBottom: "1px solid black" }}
            render={() => {
              return (
                <>
                  <View style={{ flexDirection: "row" }}>
                    <PDFImage
                      src={"/atc_receipt_logo.png"}
                      style={{ width: 280, height: 100 }}
                    />
                    <PDFImage
                      src={"/atc_receipt_logo.png"}
                      style={{ width: 280, height: 100 }}
                    />
                    <PDFImage
                      src={"/atc_receipt_logo.png"}
                      style={{ width: 280, height: 100 }}
                    />
                  </View>
                </>
              );
            }}
          ></View>
          <View
            style={{
              display: "flex",
              justifyContent: "flex-start",
              alignContent: "center",
              borderRight: "1px solid black",
              borderLeft: "1px solid black",
              borderTop: "1px solid black",
              borderBottom: "1px solid black",
            }}
          >
            <Text
              style={{ fontSize: "36px", fontWeight: 600 }}
              render={() => `NAME: ${full_name}`}
            />
          </View>
          <View
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderBottom: "1px solid black",
            }}
          >
            <Text style={{ color: "#f00", fontSize: "28px", fontWeight: 600 }}>
              BIDDER NUMBER
            </Text>
          </View>
          <View
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              borderBottom: "1px solid black",
            }}
          >
            <Text
              style={{
                color: "#203764",
                fontSize: 200,
                fontWeight: 600,
              }}
            >
              {bidder_number}
            </Text>
          </View>
          <View
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <Text
              style={{
                color: "#0070c0",
                fontSize: "28px",
                fontWeight: 600,
              }}
            >
              Registered Branch: {branch_name}
            </Text>
          </View>
          <View
            fixed
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "40px",
              borderTop: "1px solid black",
              borderBottom: "1px solid black",
              borderLeft: "1px solid black",
              borderRight: "1px solid black",
            }}
          >
            <Text
              style={{
                textAlign: "center",
                fontSize: "16px",
                fontWeight: 600,
              }}
            >
              © {getYear(new Date())} ATC JAPAN AUCTION. ALL RIGHTS RESERVED.
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default BidderNumberDocument;
