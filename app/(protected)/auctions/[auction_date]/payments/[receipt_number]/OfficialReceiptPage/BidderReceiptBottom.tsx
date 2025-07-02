import { View, Text } from "@react-pdf/renderer";

interface BidderReceiptBottomProps {
  receiptNumber: string;
}

const BidderReceiptBottom: React.FC<BidderReceiptBottomProps> = ({
  receiptNumber,
}) => (
  <View fixed>
    <Text
      style={{
        position: "absolute",
        fontSize: 8,
        bottom: -20,
        right: 20,
        textAlign: "center",
        color: "grey",
      }}
      render={() => receiptNumber}
      fixed
    />
    <Text
      style={{
        position: "absolute",
        fontSize: 8,
        bottom: -20,
        left: 0,
        right: 0,
        textAlign: "center",
        color: "grey",
      }}
      render={({ pageNumber, totalPages }) =>
        `Page ${pageNumber} of ${totalPages}`
      }
      fixed
    />
  </View>
);

export default BidderReceiptBottom;
