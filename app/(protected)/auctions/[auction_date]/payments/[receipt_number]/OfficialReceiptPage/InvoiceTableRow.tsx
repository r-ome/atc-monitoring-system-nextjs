import { Text, View, StyleSheet } from "@react-pdf/renderer";

const rowAttributes = {
  borderRightColor: "black",
  paddingTop: 2,
  borderRight: 1,
  borderBottom: 1,
  fontSize: 10,
};
const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    height: 15,
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
  bidder: {
    ...rowAttributes,
    width: "15%",
  },
  qty: {
    ...rowAttributes,
    width: "10%",
  },
  price: {
    ...rowAttributes,
    borderRight: 0,
    textAlign: "right",
    width: "15%",
    paddingRight: 5,
  },
});

interface InvoiceTableRowProps {
  items: {
    barcode: string;
    control: string;
    description: string;
    bidder: string;
    qty: string;
    price: number;
  }[];
}

const InvoiceTableRow: React.FC<InvoiceTableRowProps> = ({ items }) => {
  const rows = items
    .sort((a, b) => a.control.localeCompare(b.control))
    .map((item, i) => (
      <View style={styles.row} key={i} wrap={false}>
        <Text style={styles.barcode}>{item.barcode}</Text>
        <Text style={styles.control}>{item.control}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.bidder}>{item.bidder}</Text>
        <Text style={styles.qty}>{item.qty}</Text>
        <Text style={styles.price}>{item.price.toLocaleString()}</Text>
      </View>
    ));

  return <View>{rows}</View>;
};

export default InvoiceTableRow;
