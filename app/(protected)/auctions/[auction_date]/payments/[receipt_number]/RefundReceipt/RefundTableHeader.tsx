import { Text, View, StyleSheet } from "@react-pdf/renderer";

const rowAttributes = {
  paddingTop: 10,
  fontSize: 10,
  borderColor: "#bff0fd",
  borderRight: 1,
  height: 35,
};
const styles = StyleSheet.create({
  container: {
    borderBottom: 1,
    borderTop: 1,
    flexDirection: "row",
    fontWeight: "bold",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
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

const RefundTableHeade = () => (
  <View style={styles.container}>
    <Text style={styles.barcode}>BARCODE</Text>
    <Text style={styles.control}>CTRL #</Text>
    <Text style={styles.description}>DESCRIPTION</Text>
    <Text style={styles.qty}>QTY</Text>
    <Text style={styles.amount}>AMOUNT</Text>
    <View style={styles.dateOfRequest}>
      <Text>DATE OF</Text>
      <Text>REQUEST</Text>{" "}
    </View>
  </View>
);

export default RefundTableHeade;
