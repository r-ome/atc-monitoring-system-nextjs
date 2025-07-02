import { View, Text } from "@react-pdf/renderer";

interface BidderReceiptTopProps {
  receiptNumber: string;
}

const BidderReceiptTop: React.FC<BidderReceiptTopProps> = ({
  receiptNumber,
}) => (
  <View fixed>
    <Text
      style={{
        position: "absolute",
        fontSize: 8,
        top: 10,
        right: 20,
        textAlign: "center",
        color: "grey",
      }}
      render={() => receiptNumber}
      fixed
    />
  </View>
);

export default BidderReceiptTop;
