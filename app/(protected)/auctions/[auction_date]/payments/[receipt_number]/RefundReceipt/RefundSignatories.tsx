import { Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    height: 40,
    fontSize: 10,
  },
  requestedByLabel: {
    paddingLeft: 3,
    paddingTop: 5,
    fontSize: 8,
  },
});

const RefundSignatories = () => {
  return (
    <View style={{ width: 580 }}>
      <View style={styles.row}>
        <Text style={{ ...styles.requestedByLabel }}>REQUESTED BY:</Text>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
        {[
          "WAREHOUSE STAFF",
          "AUTHORIZED SUPERVISOR",
          "CUSTOMER'S SIGNATURE",
        ].map((item, i) => (
          <View key={i} style={{ fontSize: 10 }}>
            <View
              style={{
                borderTop: 1,
                width: "115%",
                marginLeft: "-10",
                marginBottom: 5,
              }}
            ></View>
            <Text>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export default RefundSignatories;
