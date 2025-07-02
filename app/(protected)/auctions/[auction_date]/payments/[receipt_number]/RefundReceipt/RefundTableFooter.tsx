import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  container: {
    display: "flex",
    borderRight: 1,
    borderLeft: 1,
    borderBottom: 1,
    width: 580,
  },
  row: {
    flexDirection: "row",
    height: 24,
  },
  reasonLabel: {
    fontSize: 8,
    paddingLeft: 3,
    paddingTop: 3,
  },
});

interface RefundTableFooterProps {
  reason?: string | null;
}

const RefundTableFooter: React.FC<RefundTableFooterProps> = ({ reason }) => {
  return (
    <View style={styles.container}>
      <View style={{ ...styles.row, height: 40 }} wrap={false}>
        <Text style={styles.reasonLabel}>REASON:</Text>
        <Text
          style={{
            marginLeft: 5,
            fontSize: 12,
            paddingTop: 10,
            textTransform: "uppercase",
            color: "#f00",
          }}
        >
          {reason}
        </Text>
      </View>

      <View
        style={{
          ...styles.row,
          borderTop: 1,
          fontSize: 8,
          height: 20,
          fontWeight: "bold",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
        }}
      >
        {[
          "ADDITIONAL",
          "CANCEL",
          "DISCREPANCY",
          "LESS",
          "REFUND",
          "OTHERS",
        ].map((item, i) => (
          <View key={i} style={{ flexDirection: "row", gap: 3 }}>
            <Text>{item}</Text>
            <View
              style={{
                backgroundColor: item === "REFUND" ? "green" : "white",
                width: 25,
                height: 12,
                borderRight: 1,
                borderLeft: 1,
                borderTop: 1,
                borderBottom: 1,
              }}
            ></View>
          </View>
        ))}
      </View>
    </View>
  );
};

export default RefundTableFooter;
