import { Text, View, StyleSheet } from "@react-pdf/renderer";

const rowAttributes = {
  borderRightColor: "black",
  paddingTop: 5,
  borderRight: 1,
  borderBottom: 1,
  fontSize: 10,
};
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    height: 24,
    textAlign: "center",
    flexGrow: 1,
    borderColor: "#000",
  },
  barcode: {
    ...rowAttributes,
    width: "15%",
  },
  control: { ...rowAttributes, width: "15%" },
  description: {
    ...rowAttributes,
    width: "30%",
  },
  qty: {
    ...rowAttributes,
    width: "10%",
  },
  amount: {
    ...rowAttributes,
    width: "15%",
  },
  dateOfRequest: {
    ...rowAttributes,
    paddingTop: 3,
    borderRight: 0,
    width: "15%",
  },
});

type RefundItem = {
  barcode?: string;
  control?: string;
  description?: string;
  qty?: string;
  price?: number;
};

interface RefundItemProps {
  items: RefundItem[];
}

const InvoiceTableRow: React.FC<RefundItemProps> = ({ items }) => {
  const rows = [
    ...items,
    ...(Array(Math.max(0, 10 - items.length)).fill({
      barcdoe: "",
      control: "",
      description: "",
      qty: "",
      price: 0,
    }) as RefundItem[]),
  ].map((item, i: number) => (
    <View style={styles.row} key={i} wrap={false}>
      <Text style={styles.barcode}>{item.barcode}</Text>
      <Text style={styles.control}>{item.control}</Text>
      <Text style={styles.description}>{item.description}</Text>
      <Text style={styles.qty}>{item.qty}</Text>
      <Text style={styles.amount}>
        {item.price ? item.price.toLocaleString() : ""}
      </Text>
      <Text style={styles.dateOfRequest}></Text>
    </View>
  ));

  return <View>{rows}</View>;
};

export default InvoiceTableRow;
