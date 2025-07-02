import { Text, View, StyleSheet } from "@react-pdf/renderer";

const rowAttributes = {
  borderRightColor: "black",
  paddingTop: 3,
  fontSize: 10,
  borderRight: 1,
};
const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    fontWeight: "bold",
    backgroundColor: "#bff0fd",
    borderBottom: 1,
    borderTop: 1,
    height: 24,
    textAlign: "center",
    flexGrow: 1,
  },
  barcode: {
    ...rowAttributes,
    width: "15%",
  },
  control: {
    ...rowAttributes,
    width: "15%",
  },
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
    display: "flex",
    justifyContent: "center",
    width: "15%",
  },
});

const InvoiceTableHeader = () => (
  <View style={styles.container}>
    <Text style={styles.barcode}>BARCODE</Text>
    <Text style={styles.control}>CONTROL</Text>
    <Text style={styles.description}>DESCRIPTION</Text>
    <Text style={styles.bidder}>BIDDER #</Text>
    <Text style={styles.qty}>QTY</Text>
    <Text style={styles.price}>PRICE</Text>
  </View>
);

export default InvoiceTableHeader;
