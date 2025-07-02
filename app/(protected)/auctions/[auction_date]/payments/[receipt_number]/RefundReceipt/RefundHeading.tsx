import { View, Image as PDFImage, Text } from "@react-pdf/renderer";

interface RefundHeadingProps {
  auctionDate: string;
  receiptNumber: string;
}

const RefundHeading: React.FC<RefundHeadingProps> = ({
  auctionDate,
  receiptNumber,
}) => {
  return (
    <View
      fixed
      style={{ marginBottom: 20 }}
      render={() => {
        return (
          <>
            <View style={{ flexDirection: "row" }}>
              <PDFImage
                src={"/atc_receipt_logo.png"}
                style={{ width: 200, height: 50 }}
              />
              <View
                style={{
                  borderTop: 1,
                  borderBottom: 1,
                  borderRight: 1,
                  borderLeft: 1,
                  marginLeft: 5,
                  paddingLeft: 5,
                  paddingRight: 5,
                  paddingTop: 5,
                  fontSize: 10,
                  width: 190,
                }}
              >
                <Text>Auction Date:</Text>
                <Text
                  style={{
                    width: "100%",
                    textAlign: "center",
                    fontSize: 10,
                    marginTop: 5,
                    fontWeight: "bold",
                  }}
                >
                  {auctionDate}
                </Text>
              </View>
              <View
                style={{
                  borderTop: 1,
                  borderBottom: 1,
                  borderRight: 1,
                  borderLeft: 1,
                  marginLeft: 5,
                  paddingLeft: 5,
                  paddingRight: 5,
                  paddingTop: 5,
                  fontSize: 10,
                  width: 180,
                }}
              >
                <Text>BIDDER No:</Text>
                <Text
                  style={{
                    width: "100%",
                    textAlign: "center",
                    fontSize: 18,
                  }}
                >
                  {receiptNumber}
                </Text>
              </View>
            </View>
          </>
        );
      }}
    ></View>
  );
};

export default RefundHeading;
