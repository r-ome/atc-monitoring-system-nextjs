import { View, Text } from "@react-pdf/renderer";

interface RefundReceiptTopProps {
  receiptNumber: string;
}

const RefundReceiptTop: React.FC<RefundReceiptTopProps> = ({
  receiptNumber,
}) => (
  <View fixed>
    <Text
      style={{
        position: "absolute",
        fontSize: 8,
        bottom: -30,
        right: 20,
        textAlign: "center",
        color: "grey",
      }}
      render={() => receiptNumber}
      fixed
    />
  </View>
);

export default RefundReceiptTop;
