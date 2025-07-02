import { Text, View, StyleSheet } from "@react-pdf/renderer";
import { Computation } from "./BidderInvoiceDocument";

const rowAttributes = {
  borderRightColor: "black",
  paddingTop: 5,
  borderBottom: 1,
  fontSize: 10,
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    borderRight: 1,
    borderColor: "#000",
    width: 585,
  },
  row: {
    flexDirection: "row",
    height: 24,
    fontSize: 10,
    borderLeft: 1,
    borderColor: "#000",
  },
  totalNoOfItemsLabel: {
    ...rowAttributes,
    width: "30%",
    textAlign: "right",
    paddingRight: 3,
    borderRight: 1,
  },
  totalNoOfItemsValue: {
    ...rowAttributes,
    paddingLeft: 3,
    width: "45%",
    textAlign: "center",
    fontWeight: "bold",
    borderRight: 1,
  },
  totalLabel: {
    ...rowAttributes,
    fontWeight: "bold",
    width: "10%",
    textAlign: "center",
    borderRight: 1,
  },
  totalValue: {
    ...rowAttributes,
    textAlign: "right",
    paddingRight: 5,
    width: "15%",
  },
});

interface InvoiceTableFooterProps {
  computation: Computation;
}

const InvoiceTableFooter: React.FC<InvoiceTableFooterProps> = ({
  computation,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.row} wrap={false}>
        <Text style={styles.totalNoOfItemsLabel}>TOTAL No. OF ITEMS:</Text>
        <Text style={styles.totalNoOfItemsValue}>
          {computation.number_of_items}
        </Text>

        <Text style={styles.totalLabel}>TOTAL</Text>
        <Text style={styles.totalValue}>
          {computation.total_item_price.toLocaleString()}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.totalNoOfItemsLabel}>PULL OUT BY:</Text>
        <Text style={styles.totalNoOfItemsValue}></Text>
        <Text style={styles.totalLabel}>{computation.service_charge}%</Text>
        <Text style={styles.totalValue}>
          {computation.service_charge_amount.toLocaleString()}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.totalNoOfItemsLabel}>CHECKED BY:</Text>
        <Text style={styles.totalNoOfItemsValue}></Text>
        <Text style={styles.totalLabel}>LESS</Text>
        <Text style={{ ...styles.totalValue, backgroundColor: "#feb2b2" }}>
          {computation.less}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.totalNoOfItemsLabel}>PULL OUT DATE:</Text>
        <Text style={{ ...styles.totalNoOfItemsValue, width: "30%" }}></Text>
        <Text
          style={{
            ...styles.totalLabel,
            width: "25%",
            textAlign: "right",
            paddingRight: 5,
          }}
        >
          STORAGE FEE
        </Text>
        <Text style={styles.totalValue}></Text>
      </View>

      <View style={{ ...styles.row, backgroundColor: "#bff0fd" }}>
        <Text style={{ ...styles.totalNoOfItemsLabel, borderRight: 0 }}></Text>
        <Text
          style={{
            ...styles.totalNoOfItemsValue,
            width: "30%",
            borderRight: 0,
          }}
        ></Text>
        <Text
          style={{
            ...styles.totalLabel,
            width: "25%",
            textAlign: "right",
            paddingRight: 5,
          }}
        >
          GRAND TOTAL
        </Text>
        <Text
          style={{
            ...styles.totalValue,
            fontWeight: "bold",
            backgroundColor:
              computation.grandTotal < 0 ? "#feb2b2" : "transparent",
          }}
        >
          {computation.grandTotal.toLocaleString()}
        </Text>
      </View>
    </View>
  );
};

export default InvoiceTableFooter;
